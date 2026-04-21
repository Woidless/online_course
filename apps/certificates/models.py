import uuid
from django.db import models
from apps.users.models import User
from apps.courses.models import Course


class Certificate(models.Model):
    uid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name='Уникальный ID'
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='certificates',
        limit_choices_to={'role': 'student'},
        verbose_name='Студент'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='certificates',
        verbose_name='Курс'
    )
    issued_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата выдачи')
    pdf = models.FileField(
        upload_to='certificates/',
        null=True,
        blank=True,
        verbose_name='PDF файл'
    )

    class Meta:
        verbose_name = 'Сертификат'
        verbose_name_plural = 'Сертификаты'
        unique_together = ('student', 'course')
        ordering = ['-issued_at']

    def __str__(self):
        return f'{self.student.full_name} — {self.course.title}'