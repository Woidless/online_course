from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email(self, user_email: str, verify_url: str):
    try:
        send_mail(
            subject='Подтвердите ваш email — Taalim Bulak',
            message=f'Перейдите по ссылке для подтверждения аккаунта:\n\n{verify_url}\n\nСсылка действительна 24 часа.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, user_email: str, reset_url: str):
    try:
        send_mail(
            subject='Сброс пароля — Taalim Bulak',
            message=f'Для сброса пароля перейдите по ссылке:\n\n{reset_url}\n\nСсылка действительна 2 часа.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)
