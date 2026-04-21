from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Доступ только для учеников"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'student'
        )


class IsTeacher(BasePermission):
    """Доступ только для учителей"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'teacher'
        )


class IsAdmin(BasePermission):
    """Доступ только для администраторов"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsTeacherOrAdmin(BasePermission):
    """Доступ для учителей и администраторов"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ('teacher', 'admin')
        )


class IsOwnerOrAdmin(BasePermission):
    """Доступ к объекту — только владелец или администратор"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        # obj может быть User или объект с полем user/student/teacher
        if hasattr(obj, 'email'):
            return obj == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'student'):
            return obj.student == request.user
        return False