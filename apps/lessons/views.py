from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsTeacherOrAdmin, IsStudent
from apps.courses.models import Course, Enrollment
from .models import Lesson, LessonMaterial, LessonProgress
from .serializers import (
    LessonSerializer,
    LessonMaterialSerializer,
    LessonProgressSerializer,
    ScheduleSerializer,
)


class LessonListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/courses/<course_id>/lessons/ — список уроков курса
    POST /api/courses/<course_id>/lessons/ — создать урок (teacher, admin)
    """
    serializer_class = LessonSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        course_id = self.kwargs['course_id']

        if user.role in ('teacher', 'admin'):
            return Lesson.objects.filter(course_id=course_id)

        # Студент — только опубликованные уроки курсов на которые записан
        return Lesson.objects.filter(
            course_id=course_id,
            is_published=True,
            course__groups__enrollments__student=user,
            course__groups__enrollments__status='active',
        ).distinct()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        course = get_object_or_404(Course, pk=self.kwargs['course_id'])
        serializer.save(course=course)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/lessons/<id>/ — детали урока
    PUT    /api/lessons/<id>/ — редактировать (teacher, admin)
    DELETE /api/lessons/<id>/ — удалить (teacher, admin)
    """
    serializer_class = LessonSerializer
    queryset = Lesson.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]


class LessonMaterialCreateView(generics.CreateAPIView):
    """
    POST /api/lessons/<lesson_id>/materials/ — добавить материал к уроку
    """
    serializer_class = LessonMaterialSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_id'])
        serializer.save(lesson=lesson)


class LessonMaterialDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/materials/<id>/ — удалить материал
    """
    serializer_class = LessonMaterialSerializer
    permission_classes = (IsTeacherOrAdmin,)
    queryset = LessonMaterial.objects.all()


class MarkLessonCompleteView(APIView):
    """
    POST /api/lessons/<lesson_id>/complete/ — отметить урок как пройденный
    """
    permission_classes = (IsStudent,)

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id, is_published=True)

        # Проверяем что студент записан на этот курс
        enrolled = Enrollment.objects.filter(
            student=request.user,
            group__course=lesson.course,
            status='active'
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Вы не записаны на этот курс.'},
                status=status.HTTP_403_FORBIDDEN
            )

        progress, created = LessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson,
            defaults={
                'completed': True,
                'completed_at': timezone.now()
            }
        )

        if not created and not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()

        return Response({'detail': 'Урок отмечен как пройденный.'})


class MyCourseProgressView(APIView):
    """
    GET /api/courses/<course_id>/progress/ — прогресс студента по курсу
    """
    permission_classes = (IsStudent,)

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)

        total_lessons = Lesson.objects.filter(
            course=course,
            is_published=True
        ).count()

        completed_lessons = LessonProgress.objects.filter(
            student=request.user,
            lesson__course=course,
            completed=True
        ).count()

        percent = round((completed_lessons / total_lessons * 100) if total_lessons else 0, 1)

        return Response({
            'course_id': course_id,
            'course_title': course.title,
            'total_lessons': total_lessons,
            'completed_lessons': completed_lessons,
            'progress_percent': percent,
        })


class ScheduleView(generics.ListAPIView):
    """
    GET /api/schedule/ — расписание занятий (уроки с zoom_url и scheduled_at)
    """
    serializer_class = ScheduleSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        if user.role == 'teacher':
            return Lesson.objects.filter(
                course__teacher=user,
                scheduled_at__gte=now,
                zoom_url__isnull=False
            ).order_by('scheduled_at')

        if user.role == 'student':
            return Lesson.objects.filter(
                course__groups__enrollments__student=user,
                course__groups__enrollments__status='active',
                scheduled_at__gte=now,
                zoom_url__isnull=False
            ).distinct().order_by('scheduled_at')

        # admin — всё расписание
        return Lesson.objects.filter(
            scheduled_at__gte=now,
            zoom_url__isnull=False
        ).order_by('scheduled_at')