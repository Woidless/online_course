import stripe
from django.conf import settings
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsStudent, IsTeacherOrAdmin
from apps.courses.models import CourseGroup, Enrollment
from .models import Payment
from .serializers import PaymentSerializer, CreateCheckoutSessionSerializer


class CreateCheckoutSessionView(APIView):
    """
    POST /api/payments/checkout/
    Студент передаёт group_id → получает Stripe Checkout URL для оплаты.
    """
    permission_classes = (IsStudent,)

    def post(self, request):
        serializer = CreateCheckoutSessionSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        group = serializer.context['group']
        course = group.course

        # Проверяем — не оплачено ли уже
        existing = Payment.objects.filter(
            student=request.user,
            group=group,
            status=Payment.Status.PAID
        ).first()
        if existing:
            return Response(
                {'detail': 'Вы уже оплатили этот курс.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем — не записан ли уже (бесплатная запись)
        if Enrollment.objects.filter(student=request.user, group=group).exists():
            return Response(
                {'detail': 'Вы уже записаны в эту группу.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        # Создаём Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(course.price * 100),  # Stripe принимает центы
                    'product_data': {
                        'name': course.title,
                        'description': f'Группа: {group.name}',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=settings.STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata={
                'student_id': request.user.id,
                'group_id': group.id,
            }
        )

        # Создаём Payment со статусом pending
        Payment.objects.update_or_create(
            student=request.user,
            group=group,
            defaults={
                'amount': course.price,
                'currency': 'USD',
                'status': Payment.Status.PENDING,
                'stripe_checkout_session_id': checkout_session.id,
            }
        )

        return Response({'checkout_url': checkout_session.url})


class PaymentListView(generics.ListAPIView):
    """
    GET /api/payments/ — список платежей
    Студент видит свои, admin/teacher — все.
    """
    serializer_class = PaymentSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Payment.objects.filter(student=user)
        return Payment.objects.all()


class PaymentDetailView(generics.RetrieveAPIView):
    """
    GET /api/payments/<id>/ — детали платежа
    """
    serializer_class = PaymentSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Payment.objects.filter(student=user)
        return Payment.objects.all()