from django.contrib import admin
from .models import Lesson, LessonMaterial, LessonProgress


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_published', 'scheduled_at')
    list_filter = ('is_published', 'course')
    search_fields = ('title', 'course__title')
    ordering = ('course', 'order')


@admin.register(LessonMaterial)
class LessonMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'type')
    list_filter = ('type',)


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'completed', 'completed_at')
    list_filter = ('completed',)