import uuid
from datetime import timedelta

from django.contrib.auth import authenticate
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, EmailVerificationToken, PasswordResetToken
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    UserAvatarSerializer,
    AdminUserSerializer,
    AdminCreateUserSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .permissions import IsAdmin, IsTeacherOrAdmin
from .throttles import LoginRateThrottle, RegisterRateThrottle, PasswordResetRateThrottle
from .pagination import UserPagination
from .tasks import send_verification_email, send_password_reset_email


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (RegisterRateThrottle,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Создаём токен верификации
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        # Отправляем письмо асинхронно
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{token.token}"
        send_verification_email.delay(user.email, verify_url)

        return Response(
            {'detail': 'Регистрация успешна. Проверьте email для подтверждения.'},
            status=status.HTTP_201_CREATED
        )


class VerifyEmailView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, token):
        token_obj = get_object_or_404(EmailVerificationToken, token=token)

        if token_obj.is_expired():
            token_obj.delete()
            return Response(
                {'detail': 'Ссылка истекла. Запросите новую.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = token_obj.user
        user.is_active = True
        user.save()
        token_obj.delete()

        return Response({'detail': 'Email подтверждён. Теперь вы можете войти.'})


class LoginView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (LoginRateThrottle,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )

        if not user:
            return Response(
                {'detail': 'Неверный email или пароль.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'Аккаунт не активирован. Проверьте email.'},
                status=status.HTTP_403_FORBIDDEN
            )

        tokens = get_tokens_for_user(user)
        response = Response({
            'user': UserProfileSerializer(user).data,
            'access': tokens['access'],
        })
        response.set_cookie(
            'refresh_token',
            tokens['refresh'],
            max_age=7 * 24 * 3600,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/',
        )
        return response


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                RefreshToken(refresh_token).blacklist()
        except Exception:
            pass
        response = Response({'detail': 'Вы вышли из системы.'})
        response.delete_cookie('refresh_token', path='/')
        return response


class CookieTokenRefreshView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {'detail': 'Требуется аутентификация.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            old_token = RefreshToken(refresh_token)
            old_token.blacklist()
            user = User.objects.get(id=old_token['user_id'])
            tokens = get_tokens_for_user(user)

            response = Response({'access': tokens['access']})
            response.set_cookie(
                'refresh_token',
                tokens['refresh'],
                max_age=7 * 24 * 3600,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/',
            )
            return response
        except Exception:
            response = Response(
                {'detail': 'Сессия истекла. Войдите снова.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie('refresh_token', path='/')
            return response


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class AvatarUploadView(generics.UpdateAPIView):
    serializer_class = UserAvatarSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Неверный текущий пароль.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Пароль успешно изменён.'})


class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (PasswordResetRateThrottle,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Не раскрываем существование email
            return Response({'detail': 'Если email зарегистрирован, письмо отправлено.'})

        token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=2)
        )

        reset_url = f"{settings.FRONTEND_URL}/reset-password/{token.token}"
        send_password_reset_email.delay(user.email, reset_url)

        return Response({'detail': 'Если email зарегистрирован, письмо отправлено.'})


class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_obj = get_object_or_404(
            PasswordResetToken,
            token=serializer.validated_data['token'],
            is_used=False
        )

        if token_obj.is_expired():
            return Response(
                {'detail': 'Ссылка истекла. Запросите новую.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = token_obj.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        token_obj.is_used = True
        token_obj.save()

        return Response({'detail': 'Пароль успешно изменён.'})


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = (IsTeacherOrAdmin,)
    pagination_class = UserPagination

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | Q(full_name__icontains=search)
            )
        return queryset


class AdminCreateUserView(APIView):
    """
    POST /api/users/create/ — создать пользователя с любой ролью (admin only)
    """
    permission_classes = (IsAdmin,)

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = (IsAdmin,)
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        target = self.get_object()
        if target == request.user:
            return Response(
                {'detail': 'Нельзя редактировать собственную учётную запись через панель администратора.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if target.is_superuser and not request.user.is_superuser:
            return Response(
                {'detail': 'Нельзя изменять учётную запись суперпользователя.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class AdminDeleteUserView(APIView):
    """
    DELETE /api/users/<pk>/delete/ — удалить пользователя (только суперпользователь)
    """
    permission_classes = (IsAuthenticated,)

    def delete(self, request, pk):
        if request.user.role not in ('admin',) and not request.user.is_superuser:
            return Response(
                {'detail': 'Нет прав для удаления пользователей.'},
                status=status.HTTP_403_FORBIDDEN
            )
        user = get_object_or_404(User, pk=pk)
        if user == request.user:
            return Response(
                {'detail': 'Нельзя удалить собственную учётную запись.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if user.is_superuser:
            return Response(
                {'detail': 'Нельзя удалить суперпользователя.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if user.role == 'admin' and not request.user.is_superuser:
            return Response(
                {'detail': 'Только суперпользователи могут удалять администраторов.'},
                status=status.HTTP_403_FORBIDDEN
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserBlockView(APIView):
    permission_classes = (IsAdmin,)

    def post(self, request, pk, action):
        user = get_object_or_404(User, pk=pk)

        if user == request.user:
            return Response(
                {'detail': 'Нельзя заблокировать самого себя.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_superuser and not request.user.is_superuser:
            return Response(
                {'detail': 'Нельзя блокировать суперпользователя.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if action == 'block':
            user.is_active = False
            user.save()
            return Response({'detail': f'Пользователь {user.email} заблокирован.'})

        if action == 'unblock':
            user.is_active = True
            user.save()
            return Response({'detail': f'Пользователь {user.email} разблокирован.'})

        return Response(
            {'detail': 'Неизвестное действие.'},
            status=status.HTTP_400_BAD_REQUEST
        )