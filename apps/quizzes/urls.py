from django.urls import path
from .views import (
    QuizListCreateView,
    QuizDetailView,
    QuestionCreateView,
    QuestionDetailView,
    AnswerCreateView,
    StartQuizView,
    SubmitQuizView,
    MyQuizAttemptsView,
    QuizAttemptsView,
)

urlpatterns = [
    # Тесты
    path('lessons/<int:lesson_id>/quizzes/', QuizListCreateView.as_view(), name='quiz-list'),
    path('quizzes/<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('quizzes/<int:quiz_id>/start/', StartQuizView.as_view(), name='quiz-start'),
    path('quizzes/<int:quiz_id>/my-attempts/', MyQuizAttemptsView.as_view(), name='quiz-my-attempts'),
    path('quizzes/<int:quiz_id>/attempts/', QuizAttemptsView.as_view(), name='quiz-attempts'),

    # Вопросы
    path('quizzes/<int:quiz_id>/questions/', QuestionCreateView.as_view(), name='question-create'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),

    # Варианты ответов
    path('questions/<int:question_id>/answers/', AnswerCreateView.as_view(), name='answer-create'),

    # Попытки
    path('attempts/<int:attempt_id>/submit/', SubmitQuizView.as_view(), name='attempt-submit'),
]