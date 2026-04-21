from django.contrib import admin
from .models import Course, CourseGroup, Enrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'is_published', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('title', 'teacher__email')


@admin.register(CourseGroup)
class CourseGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'teacher', 'starts_at')
    search_fields = ('name', 'course__title')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'group', 'status', 'enrolled_at')
    list_filter = ('status',)