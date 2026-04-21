from django.db import models
from apps.courses.models import Course
from apps.users.models import User


class Lesson(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name='Курс'
    )
    title = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    content = models.TextField(blank=True, verbose_name='Текстовый контент')
    youtube_url = models.URLField(
        null=True, blank=True,
        verbose_name='Ссылка на YouTube'
    )
    zoom_url = models.URLField(
        null=True, blank=True,
        verbose_name='Ссылка на Zoom'
    )
    scheduled_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Дата и время занятия'
    )
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    is_published = models.BooleanField(default=False, verbose_name='Опубликован')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Урок'
        verbose_name_plural = 'Уроки'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'{self.course.title} — {self.title}'


class LessonMaterial(models.Model):

    class MaterialType(models.TextChoices):
        FILE = 'file', 'Файл'
        PRESENTATION = 'presentation', 'Презентация'
        LINK = 'link', 'Ссылка'

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='materials',
        verbose_name='Урок'
    )
    title = models.CharField(max_length=255, verbose_name='Название')
    type = models.CharField(
        max_length=20,
        choices=MaterialType.choices,
        verbose_name='Тип'
    )
    file = models.FileField(
        upload_to='lessons/materials/',
        null=True, blank=True,
        verbose_name='Файл'
    )
    url = models.URLField(null=True, blank=True, verbose_name='Ссылка')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Материал урока'
        verbose_name_plural = 'Материалы урока'

    def __str__(self):
        return f'{self.lesson.title} — {self.title}'


class LessonProgress(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_progress',
        limit_choices_to={'role': 'student'},
        verbose_name='Ученик'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='progress',
        verbose_name='Урок'
    )
    completed = models.BooleanField(default=False, verbose_name='Пройден')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата прохождения')

    class Meta:
        verbose_name = 'Прогресс урока'
        verbose_name_plural = 'Прогресс уроков'
        unique_together = ('student', 'lesson')

    def __str__(self):
        return f'{self.student.full_name} — {self.lesson.title}'