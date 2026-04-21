from django.db import models
from apps.users.models import User
from apps.lessons.models import Lesson


class Assignment(models.Model):
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name='Урок'
    )
    title = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(verbose_name='Описание задания')
    due_date = models.DateTimeField(null=True, blank=True, verbose_name='Срок сдачи')
    max_score = models.PositiveIntegerField(default=100, verbose_name='Максимальный балл')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Задание'
        verbose_name_plural = 'Задания'
        ordering = ['due_date']

    def __str__(self):
        return f'{self.lesson.title} — {self.title}'


class Submission(models.Model):

    class Status(models.TextChoices):
        SUBMITTED = 'submitted', 'Сдано'
        GRADED = 'graded', 'Оценено'
        RETURNED = 'returned', 'Возвращено на доработку'

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name='Задание'
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='submissions',
        limit_choices_to={'role': 'student'},
        verbose_name='Ученик'
    )
    content = models.TextField(blank=True, verbose_name='Текст ответа')
    file = models.FileField(
        upload_to='submissions/',
        null=True, blank=True,
        verbose_name='Файл'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
        verbose_name='Статус'
    )
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата сдачи')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ответ на задание'
        verbose_name_plural = 'Ответы на задания'
        unique_together = ('assignment', 'student')
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.student.full_name} → {self.assignment.title}'


class Grade(models.Model):
    submission = models.OneToOneField(
        Submission,
        on_delete=models.CASCADE,
        related_name='grade',
        verbose_name='Ответ'
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='grades_given',
        limit_choices_to={'role': 'teacher'},
        verbose_name='Преподаватель'
    )
    score = models.PositiveIntegerField(verbose_name='Оценка')
    feedback = models.TextField(blank=True, verbose_name='Комментарий')
    graded_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата оценки')

    class Meta:
        verbose_name = 'Оценка'
        verbose_name_plural = 'Оценки'

    def __str__(self):
        return f'{self.submission.student.full_name} — {self.score}/{self.submission.assignment.max_score}'