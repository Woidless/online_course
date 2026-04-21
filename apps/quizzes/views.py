from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsTeacherOrAdmin, IsStudent
from apps.courses.models import Enrollment
from apps.lessons.models import Lesson
from .models import Quiz, Question, Answer, QuizAttempt
from .serializers import (
    QuizSerializer,
    QuizAttemptSerializer,
    SubmitQuizSerializer,
    QuestionSerializer,
)


class QuizListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/lessons/<lesson_id>/quizzes/ — список тестов урока
    POST /api/lessons/<lesson_id>/quizzes/ — создать тест (teacher, admin)
    """
    serializer_class = QuizSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in ('teacher', 'admin'):
            return Quiz.objects.filter(lesson_id=self.kwargs['lesson_id'])
        return Quiz.objects.filter(
            lesson_id=self.kwargs['lesson_id'],
            is_published=True
        )

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_id'])
        serializer.save(lesson=lesson)


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/quizzes/<id>/ — детали теста
    PUT    /api/quizzes/<id>/ — редактировать (teacher, admin)
    DELETE /api/quizzes/<id>/ — удалить (teacher, admin)
    """
    serializer_class = QuizSerializer
    queryset = Quiz.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]


class QuestionCreateView(generics.CreateAPIView):
    """
    POST /api/quizzes/<quiz_id>/questions/ — добавить вопрос
    """
    serializer_class = QuestionSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def perform_create(self, serializer):
        quiz = get_object_or_404(Quiz, pk=self.kwargs['quiz_id'])
        serializer.save(quiz=quiz)


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    PUT    /api/questions/<id>/ — редактировать вопрос
    DELETE /api/questions/<id>/ — удалить вопрос
    """
    serializer_class = QuestionSerializer
    permission_classes = (IsTeacherOrAdmin,)
    queryset = Question.objects.all()


class AnswerCreateView(APIView):
    """
    POST /api/questions/<question_id>/answers/ — добавить вариант ответа
    """
    permission_classes = (IsTeacherOrAdmin,)

    def post(self, request, question_id):
        question = get_object_or_404(Question, pk=question_id)
        answers_data = request.data.get('answers', [])

        if not isinstance(answers_data, list):
            return Response(
                {'detail': 'Ожидается список вариантов ответов.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Удаляем старые варианты и создаём новые
        question.answers.all().delete()
        created = []
        for item in answers_data:
            answer = Answer.objects.create(
                question=question,
                text=item.get('text', ''),
                is_correct=item.get('is_correct', False)
            )
            created.append({'id': answer.id, 'text': answer.text, 'is_correct': answer.is_correct})

        return Response(created, status=status.HTTP_201_CREATED)


class StartQuizView(APIView):
    """
    POST /api/quizzes/<quiz_id>/start/ — начать тест (student)
    """
    permission_classes = (IsStudent,)

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id, is_published=True)

        # Проверяем запись на курс
        enrolled = Enrollment.objects.filter(
            student=request.user,
            group__course=quiz.lesson.course,
            status='active'
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Вы не записаны на этот курс.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем незавершённую попытку
        existing = QuizAttempt.objects.filter(
            quiz=quiz,
            student=request.user,
            status=QuizAttempt.Status.IN_PROGRESS
        ).first()

        if existing:
            return Response(
                QuizAttemptSerializer(existing).data,
                status=status.HTTP_200_OK
            )

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=request.user,
        )
        return Response(
            QuizAttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED
        )


class SubmitQuizView(APIView):
    """
    POST /api/attempts/<attempt_id>/submit/ — сдать тест
    """
    permission_classes = (IsStudent,)

    def post(self, request, attempt_id):
        attempt = get_object_or_404(
            QuizAttempt,
            pk=attempt_id,
            student=request.user,
            status=QuizAttempt.Status.IN_PROGRESS
        )

        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt.answers = serializer.validated_data['answers']
        attempt.status = QuizAttempt.Status.COMPLETED
        attempt.finished_at = timezone.now()
        attempt.score = attempt.calculate_score()
        attempt.save()

        return Response(QuizAttemptSerializer(attempt).data)


class MyQuizAttemptsView(generics.ListAPIView):
    """
    GET /api/quizzes/<quiz_id>/my-attempts/ — мои попытки по тесту
    """
    serializer_class = QuizAttemptSerializer
    permission_classes = (IsStudent,)

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            quiz_id=self.kwargs['quiz_id'],
            student=self.request.user
        )


class QuizAttemptsView(generics.ListAPIView):
    """
    GET /api/quizzes/<quiz_id>/attempts/ — все попытки (teacher, admin)
    """
    serializer_class = QuizAttemptSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            quiz_id=self.kwargs['quiz_id']
        ).select_related('student', 'quiz')