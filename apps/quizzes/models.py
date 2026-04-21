from django.db import models
from django.utils import timezone
from apps.users.models import User
from apps.lessons.models import Lesson


class Quiz(models.Model):
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='quizzes',
        verbose_name='Урок'
    )
    title = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    time_limit = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name='Ограничение времени (минуты)'
    )
    passing_score = models.PositiveIntegerField(
        default=60,
        verbose_name='Проходной балл (%)'
    )
    is_published = models.BooleanField(default=False, verbose_name='Опубликован')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Тест'
        verbose_name_plural = 'Тесты'

    def __str__(self):
        return f'{self.lesson.title} — {self.title}'


class Question(models.Model):

    class QuestionType(models.TextChoices):
        SINGLE = 'single', 'Один вариант'
        MULTIPLE = 'multiple', 'Несколько вариантов'
        TEXT = 'text', 'Текстовый ответ'

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name='Тест'
    )
    text = models.TextField(verbose_name='Вопрос')
    type = models.CharField(
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.SINGLE,
        verbose_name='Тип вопроса'
    )
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    points = models.PositiveIntegerField(default=1, verbose_name='Баллы за вопрос')

    class Meta:
        verbose_name = 'Вопрос'
        verbose_name_plural = 'Вопросы'
        ordering = ['order']

    def __str__(self):
        return f'{self.quiz.title} — вопрос {self.order}'


class Answer(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name='Вопрос'
    )
    text = models.CharField(max_length=512, verbose_name='Текст ответа')
    is_correct = models.BooleanField(default=False, verbose_name='Правильный')

    class Meta:
        verbose_name = 'Вариант ответа'
        verbose_name_plural = 'Варианты ответов'

    def __str__(self):
        return f'{self.text} ({"✓" if self.is_correct else "✗"})'


class QuizAttempt(models.Model):

    class Status(models.TextChoices):
        IN_PROGRESS = 'in_progress', 'В процессе'
        COMPLETED = 'completed', 'Завершён'
        TIMED_OUT = 'timed_out', 'Время истекло'

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts',
        verbose_name='Тест'
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quiz_attempts',
        limit_choices_to={'role': 'student'},
        verbose_name='Студент'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
        verbose_name='Статус'
    )
    answers = models.JSONField(
        default=dict,
        verbose_name='Ответы студента'
        # Формат: {question_id: answer_id} или {question_id: [answer_id, ...]} или {question_id: "текст"}
    )
    score = models.FloatField(null=True, blank=True, verbose_name='Результат (%)')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Начало')
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name='Завершение')

    class Meta:
        verbose_name = 'Попытка прохождения теста'
        verbose_name_plural = 'Попытки прохождения тестов'
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.student.full_name} — {self.quiz.title}'

    def calculate_score(self):
        """Подсчёт результата в процентах"""
        questions = self.quiz.questions.prefetch_related('answers')
        total_points = sum(q.points for q in questions)
        if total_points == 0:
            return 0.0

        earned_points = 0
        for question in questions:
            student_answer = self.answers.get(str(question.id))
            if student_answer is None:
                continue

            if question.type == Question.QuestionType.SINGLE:
                correct = question.answers.filter(is_correct=True).first()
                if correct and str(correct.id) == str(student_answer):
                    earned_points += question.points

            elif question.type == Question.QuestionType.MULTIPLE:
                correct_ids = set(
                    str(a.id) for a in question.answers.filter(is_correct=True)
                )
                student_ids = set(str(i) for i in student_answer)
                if correct_ids == student_ids:
                    earned_points += question.points

            elif question.type == Question.QuestionType.TEXT:
                # Текстовые ответы не проверяются автоматически
                pass

        return round(earned_points / total_points * 100, 1)