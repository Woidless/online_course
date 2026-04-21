from rest_framework import serializers
from django.utils import timezone
from .models import Lesson, LessonMaterial, LessonProgress


class LessonMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonMaterial
        fields = ('id', 'title', 'type', 'file', 'url', 'created_at')
        read_only_fields = ('id', 'created_at')


class LessonSerializer(serializers.ModelSerializer):
    materials = LessonMaterialSerializer(many=True, read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            'id', 'course', 'title', 'description', 'content',
            'youtube_url', 'zoom_url', 'scheduled_at',
            'order', 'is_published', 'materials',
            'is_completed', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.role != 'student':
            return None
        return LessonProgress.objects.filter(
            student=request.user,
            lesson=obj,
            completed=True
        ).exists()


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = ('id', 'lesson', 'lesson_title', 'completed', 'completed_at')
        read_only_fields = ('id', 'completed_at')


class ScheduleSerializer(serializers.ModelSerializer):
    """Урок в расписании — только нужные поля"""
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Lesson
        fields = (
            'id', 'title', 'course_title',
            'zoom_url', 'scheduled_at',
        )