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
    Если есть returned-работа, обновляет её вместо создания новой.
    """
    permission_classes = (IsStudent,)

    def post(self, request, assignment_id):
        get_object_or_404(Assignment, pk=assignment_id)
        data = {key: val for key, val in request.data.items()}
        data['assignment'] = assignment_id
        if 'file' in request.FILES:
            data['file'] = request.FILES['file']

        existing = Submission.objects.filter(
            assignment_id=assignment_id,
            student=request.user
        ).first()

        if existing:
            if existing.status != Submission.Status.RETURNED:
                return Response(
                    {'detail': 'Вы уже сдали это задание.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Resubmission: update the returned submission
            existing.content = data.get('content', '')
            if 'file' in data:
                if existing.file:
                    existing.file.delete(save=False)
                existing.file = data['file']
            elif existing.file:
                existing.file.delete(save=False)
                existing.file = None
            existing.status = Submission.Status.SUBMITTED
            existing.save()
            return Response(
                SubmissionSerializer(existing, context={'request': request}).data,
                status=status.HTTP_200_OK
            )

        serializer = SubmissionCreateSerializer(
            data=data,
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


class TeacherSubmissionsView(generics.ListAPIView):
    """
    GET /api/submissions/teacher/ — все работы по курсам учителя (teacher, admin)
    """
    serializer_class = SubmissionSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Submission.objects.all().select_related(
                'student', 'assignment', 'grade'
            ).order_by('-submitted_at')
        return Submission.objects.filter(
            assignment__lesson__course__teacher=user
        ).select_related('student', 'assignment', 'grade').order_by('-submitted_at')


class SubmissionDetailView(generics.RetrieveAPIView):
    """
    GET /api/submissions/<id>/ — детали работы (teacher, admin)
    """
    serializer_class = SubmissionSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def get_queryset(self):
        return Submission.objects.all().select_related('student', 'assignment', 'grade')


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