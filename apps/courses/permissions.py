from rest_framework.permissions import BasePermission
from apps.users.permissions import IsAdmin, IsTeacher


class IsTeacherOfCourse(BasePermission):
    """Учитель может редактировать только свои курсы"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        if hasattr(obj, 'course'):
            return obj.course.teacher == request.user
        return False


class IsTeacherOfGroup(BasePermission):
    """Учитель может управлять только своими группами"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj.teacher == request.user