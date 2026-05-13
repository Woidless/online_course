import stripe
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

from apps.courses.models import Enrollment
from .models import Payment


@csrf_exempt
def stripe_webhook(request):
    """
    POST /api/payments/webhook/
    Stripe присылает сюда событие после успешной оплаты.
    Мы меняем статус Payment → paid и создаём Enrollment.
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        _handle_successful_payment(session)

    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        _handle_failed_payment(session)

    return HttpResponse(status=200)


def _handle_successful_payment(session):
    """Оплата прошла — активируем доступ студента"""
    try:
        payment = Payment.objects.get(
            stripe_checkout_session_id=session['id']
        )
    except Payment.DoesNotExist:
        return

    # Обновляем платёж
    payment.status = Payment.Status.PAID
    payment.stripe_payment_intent_id = session.get('payment_intent')
    payment.paid_at = timezone.now()
    payment.save()

    # Создаём Enrollment — студент получает доступ к курсу
    Enrollment.objects.get_or_create(
        student=payment.student,
        group=payment.group,
        defaults={'status': Enrollment.Status.ACTIVE}
    )


def _handle_failed_payment(session):
    """Сессия истекла — помечаем платёж как failed"""
    try:
        payment = Payment.objects.get(
            stripe_checkout_session_id=session['id']
        )
        payment.status = Payment.Status.FAILED
        payment.save()
    except Payment.DoesNotExist:
        return