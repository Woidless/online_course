from django.db import models
from apps.users.models import User
from apps.courses.models import CourseGroup


class Payment(models.Model):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает оплаты'
        PAID = 'paid', 'Оплачено'
        FAILED = 'failed', 'Ошибка оплаты'
        REFUNDED = 'refunded', 'Возврат'

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments',
        limit_choices_to={'role': 'student'},
        verbose_name='Студент'
    )
    group = models.ForeignKey(
        CourseGroup,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='Группа'
    )
    amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name='Сумма'
    )
    currency = models.CharField(
        max_length=3,
        default='USD',
        verbose_name='Валюта'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Статус'
    )
    # Stripe IDs
    stripe_checkout_session_id = models.CharField(
        max_length=255,
        null=True, blank=True,
        verbose_name='Stripe Checkout Session ID'
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        null=True, blank=True,
        verbose_name='Stripe Payment Intent ID'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата оплаты')

    class Meta:
        verbose_name = 'Платёж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']
        # Один студент — один платёж за одну группу
        unique_together = ('student', 'group')

    def __str__(self):
        return f'{self.student.full_name} → {self.group} [{self.get_status_display()}]'