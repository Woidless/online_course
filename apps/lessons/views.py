from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsTeacherOrAdmin, IsStudent
from apps.courses.models import Course, Enrollment
from .models import Lesson, LessonMaterial, LessonProgress, Schedule
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


class ScheduleView(generics.ListCreateAPIView):
    """
    GET  /api/schedule/        — расписание занятий (фильтруется по роли)
    POST /api/schedule/        — создать занятие в расписании (teacher, admin)
    """
    serializer_class = ScheduleSerializer
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        if user.role == 'teacher':
            # Учитель видит расписание своих групп
            return Schedule.objects.filter(
                teacher=user,
                scheduled_at__gte=now,
            ).select_related('lesson', 'group', 'teacher')

        if user.role == 'student':
            # Студент видит расписание своей группы
            return Schedule.objects.filter(
                group__enrollments__student=user,
                group__enrollments__status='active',
                scheduled_at__gte=now,
            ).select_related('lesson', 'group', 'teacher').distinct()

        # Admin — всё расписание
        return Schedule.objects.filter(
            scheduled_at__gte=now,
        ).select_related('lesson', 'group', 'teacher')


class ScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/schedule/<id>/ — детали занятия
    PUT    /api/schedule/<id>/ — редактировать (teacher, admin)
    DELETE /api/schedule/<id>/ — удалить (teacher, admin)
    """
    serializer_class = ScheduleSerializer
    queryset = Schedule.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]