import uuid
from datetime import timedelta

from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
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
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .permissions import IsAdmin


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Создаём токен верификации
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        # Отправляем письмо
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{token.token}"
        send_mail(
            subject='Подтвердите ваш email',
            message=f'Перейдите по ссылке для подтверждения: {verify_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

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
        return Response({
            'user': UserProfileSerializer(user).data,
            **tokens
        })


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Вы вышли из системы.'})
        except Exception:
            return Response(
                {'detail': 'Неверный токен.'},
                status=status.HTTP_400_BAD_REQUEST
            )


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
        send_mail(
            subject='Сброс пароля',
            message=f'Для сброса пароля перейдите по ссылке: {reset_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

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
    permission_classes = (IsAdmin,)

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = (IsAdmin,)
    queryset = User.objects.all()


class AdminUserBlockView(APIView):
    permission_classes = (IsAdmin,)

    def post(self, request, pk, action):
        user = get_object_or_404(User, pk=pk)

        if user == request.user:
            return Response(
                {'detail': 'Нельзя заблокировать самого себя.'},
                status=status.HTTP_400_BAD_REQUEST
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