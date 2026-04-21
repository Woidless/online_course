from django.contrib import admin
from .models import Assignment, Submission, Grade


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'due_date', 'max_score')
    search_fields = ('title', 'lesson__title')


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'status', 'submitted_at')
    list_filter = ('status',)


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('submission', 'score', 'teacher', 'graded_at')