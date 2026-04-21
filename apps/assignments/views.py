from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsTeacherOrAdmin, IsStudent
from apps.lessons.models import Lesson
from .models import Assignment, Submission, Grade
from .serializers import (
    AssignmentSerializer,
    SubmissionSerializer,
    SubmissionCreateSerializer,
    GradeCreateSerializer,
)


class AssignmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/lessons/<lesson_id>/assignments/ — список заданий урока
    POST /api/lessons/<lesson_id>/assignments/ — создать задание (teacher, admin)
    """
    serializer_class = AssignmentSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Assignment.objects.filter(lesson_id=self.kwargs['lesson_id'])

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_id'])
        serializer.save(lesson=lesson)


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/assignments/<id>/ — детали задания
    PUT    /api/assignments/<id>/ — редактировать (teacher, admin)
    DELETE /api/assignments/<id>/ — удалить (teacher, admin)
    """
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]


class SubmitAssignmentView(APIView):
    """
    POST /api/assignments/<assignment_id>/submit/ — сдать задание (student)
    """
    permission_classes = (IsStudent,)

    def post(self, request, assignment_id):
        get_object_or_404(Assignment, pk=assignment_id)
        serializer = SubmissionCreateSerializer(
            data={**request.data, 'assignment': assignment_id},
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        return Response(
            SubmissionSerializer(submission, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class SubmissionListView(generics.ListAPIView):
    """
    GET /api/assignments/<assignment_id>/submissions/ — все ответы (teacher, admin)
    """
    serializer_class = SubmissionSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def get_queryset(self):
        return Submission.objects.filter(
            assignment_id=self.kwargs['assignment_id']
        ).select_related('student', 'assignment', 'grade')


class MySubmissionsView(generics.ListAPIView):
    """
    GET /api/submissions/my/ — мои сданные задания (student)
    """
    serializer_class = SubmissionSerializer
    permission_classes = (IsStudent,)

    def get_queryset(self):
        return Submission.objects.filter(
            student=self.request.user
        ).select_related('assignment', 'grade')


class GradeSubmissionView(APIView):
    """
    POST /api/submissions/<submission_id>/grade/ — оценить задание (teacher, admin)
    """
    permission_classes = (IsTeacherOrAdmin,)

    def post(self, request, submission_id):
        submission = get_object_or_404(Submission, pk=submission_id)

        if hasattr(submission, 'grade'):
            return Response(
                {'detail': 'Задание уже оценено.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = GradeCreateSerializer(
            data=request.data,
            context={'request': request, 'submission': submission}
        )
        serializer.is_valid(raise_exception=True)
        grade = serializer.save(
            submission=submission,
            teacher=request.user
        )

        submission.status = Submission.Status.GRADED
        submission.save()

        return Response({
            'score': grade.score,
            'feedback': grade.feedback,
            'graded_at': grade.graded_at,
        }, status=status.HTTP_201_CREATED)


class ReturnSubmissionView(APIView):
    """
    POST /api/submissions/<submission_id>/return/ — вернуть на доработку (teacher, admin)
    """
    permission_classes = (IsTeacherOrAdmin,)

    def post(self, request, submission_id):
        submission = get_object_or_404(Submission, pk=submission_id)
        submission.status = Submission.Status.RETURNED
        submission.save()
        return Response({'detail': 'Задание возвращено на доработку.'})