from django.db import models
from apps.users.models import User


class Course(models.Model):
    title = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    cover = models.ImageField(
        upload_to='courses/covers/',
        null=True,
        blank=True,
        verbose_name='Обложка'
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='courses',
        limit_choices_to={'role': 'teacher'},
        verbose_name='Преподаватель'
    )
    is_published = models.BooleanField(default=False, verbose_name='Опубликован')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Курс'
        verbose_name_plural = 'Курсы'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class CourseGroup(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='groups',
        verbose_name='Курс'
    )
    name = models.CharField(max_length=255, verbose_name='Название группы')
    teacher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='teaching_groups',
        limit_choices_to={'role': 'teacher'},
        verbose_name='Преподаватель группы'
    )
    starts_at = models.DateField(verbose_name='Дата начала')
    ends_at = models.DateField(null=True, blank=True, verbose_name='Дата окончания')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Группа'
        verbose_name_plural = 'Группы'
        ordering = ['-starts_at']

    def __str__(self):
        return f'{self.course.title} — {self.name}'


class Enrollment(models.Model):

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Активен'
        COMPLETED = 'completed', 'Завершён'
        DROPPED = 'dropped', 'Отчислен'

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
        verbose_name='Ученик'
    )
    group = models.ForeignKey(
        CourseGroup,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name='Группа'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name='Статус'
    )
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата записи')

    class Meta:
        verbose_name = 'Запись на курс'
        verbose_name_plural = 'Записи на курсы'
        unique_together = ('student', 'group')

    def __str__(self):
        return f'{self.student.full_name} → {self.group}'