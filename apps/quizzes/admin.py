from django.contrib import admin
from .models import Quiz, Question, Answer, QuizAttempt


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'is_published', 'passing_score', 'time_limit')
    list_filter = ('is_published',)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'quiz', 'type', 'order', 'points')
    list_filter = ('type',)


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'is_correct')
    list_filter = ('is_correct',)


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'quiz', 'status', 'score', 'started_at')
    list_filter = ('status',)