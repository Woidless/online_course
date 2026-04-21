from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.users.permissions import IsAdmin, IsTeacher, IsTeacherOrAdmin
from .models import Course, CourseGroup, Enrollment
from .serializers import (
    CourseSerializer,
    CourseGroupSerializer,
    EnrollmentSerializer,
    EnrollStudentSerializer,
)
from .permissions import IsTeacherOfCourse, IsTeacherOfGroup


# ─── COURSES ────────────────────────────────────────────────

class CourseListView(generics.ListAPIView):
    """
    GET /api/courses/ - список опубликованных курсов (все авторизованные)
    """
    serializer_class = CourseSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Course.objects.all()
        if user.role == 'teacher':
            return Course.objects.filter(teacher=user)
        # student - только опубликованные курсы своих групп
        enrolled_courses = Course.objects.filter(
            groups__enrollments__student=user,
            groups__enrollments__status='active'
        ).distinct()
        return enrolled_courses


class CourseCreateView(generics.CreateAPIView):
    """
    POST /api/courses/ - создать курс (teacher, admin)
    """
    serializer_class = CourseSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def perform_create(self, serializer):
        # Если учитель создаёт - он автоматически становится автором
        if self.request.user.role == 'teacher':
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/courses/<id>/ - детали курса
    PUT    /api/courses/<id>/ - редактировать (teacher-owner, admin)
    DELETE /api/courses/<id>/ - удалить (admin)
    """
    serializer_class = CourseSerializer
    permission_classes = (IsAuthenticated, IsTeacherOfCourse)
    queryset = Course.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        if self.request.method == 'DELETE':
            return [IsAdmin()]
        return [IsAuthenticated(), IsTeacherOfCourse()]


class CoursePublishView(APIView):
    """
    POST /api/courses/<id>/publish/   - опубликовать
    POST /api/courses/<id>/unpublish/ - снять с публикации
    """
    permission_classes = (IsTeacherOrAdmin,)

    def post(self, request, pk, action):
        course = get_object_or_404(Course, pk=pk)

        if request.user.role == 'teacher' and course.teacher != request.user:
            return Response(
                {'detail': 'Нет доступа к этому курсу.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if action == 'publish':
            course.is_published = True
            course.save()
            return Response({'detail': 'Курс опубликован.'})

        if action == 'unpublish':
            course.is_published = False
            course.save()
            return Response({'detail': 'Курс снят с публикации.'})

        return Response({'detail': 'Неизвестное действие.'}, status=status.HTTP_400_BAD_REQUEST)


# ─── GROUPS ─────────────────────────────────────────────────

class CourseGroupListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/courses/<course_id>/groups/ - список групп курса
    POST /api/courses/<course_id>/groups/ - создать группу (teacher, admin)
    """
    serializer_class = CourseGroupSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return CourseGroup.objects.filter(course_id=self.kwargs['course_id'])

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        course = get_object_or_404(Course, pk=self.kwargs['course_id'])
        serializer.save(course=course)


class CourseGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/groups/<id>/ - детали группы
    PUT    /api/groups/<id>/ - редактировать (teacher-owner, admin)
    DELETE /api/groups/<id>/ - удалить (admin)
    """
    serializer_class = CourseGroupSerializer
    permission_classes = (IsAuthenticated,)
    queryset = CourseGroup.objects.all()

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAdmin()]
        if self.request.method in ('PUT', 'PATCH'):
            return [IsTeacherOrAdmin(), IsTeacherOfGroup()]
        return [IsAuthenticated()]


# ─── ENROLLMENTS ────────────────────────────────────────────

class EnrollStudentView(APIView):
    """
    POST /api/groups/<group_id>/enroll/ - записать студента в группу
    """
    permission_classes = (IsTeacherOrAdmin,)

    def post(self, request, group_id):
        group = get_object_or_404(CourseGroup, pk=group_id)

        if request.user.role == 'teacher' and group.teacher != request.user:
            return Response(
                {'detail': 'Нет доступа к этой группе.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = EnrollStudentSerializer(data={
            'student_id': request.data.get('student_id'),
            'group_id': group_id,
        })
        serializer.is_valid(raise_exception=True)

        enrollment = Enrollment.objects.create(
            student=serializer.validated_data['student'],
            group=serializer.validated_data['group'],
        )
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED
        )


class GroupEnrollmentListView(generics.ListAPIView):
    """
    GET /api/groups/<group_id>/students/ - список студентов группы
    """
    serializer_class = EnrollmentSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def get_queryset(self):
        return Enrollment.objects.filter(
            group_id=self.kwargs['group_id']
        ).select_related('student', 'group')


class MyCoursesView(generics.ListAPIView):
    """
    GET /api/courses/my/ - мои курсы (для студента - записанные, для учителя - свои)
    """
    serializer_class = CourseSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Course.objects.filter(teacher=user)
        if user.role == 'student':
            return Course.objects.filter(
                groups__enrollments__student=user,
                groups__enrollments__status='active',
                is_published=True
            ).distinct()
        return Course.objects.none()