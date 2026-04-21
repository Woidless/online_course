from rest_framework import serializers
from .models import Assignment, Submission, Grade


class AssignmentSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            'id', 'lesson', 'lesson_title',
            'title', 'description',
            'due_date', 'max_score',
            'submissions_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_submissions_count(self, obj):
        request = self.context.get('request')
        if request and request.user.role in ('teacher', 'admin'):
            return obj.submissions.count()
        return None


class GradeSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = Grade
        fields = ('id', 'score', 'feedback', 'teacher_name', 'graded_at')
        read_only_fields = ('id', 'graded_at', 'teacher_name')


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    max_score = serializers.IntegerField(source='assignment.max_score', read_only=True)
    grade = GradeSerializer(read_only=True)

    class Meta:
        model = Submission
        fields = (
            'id', 'assignment', 'assignment_title',
            'student', 'student_name',
            'content', 'file', 'status',
            'max_score', 'grade',
            'submitted_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'student', 'status',
            'submitted_at', 'updated_at',
        )


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ('assignment', 'content', 'file')

    def validate_assignment(self, value):
        request = self.context.get('request')
        # Проверяем что студент записан на курс этого задания
        from apps.courses.models import Enrollment
        enrolled = Enrollment.objects.filter(
            student=request.user,
            group__course=value.lesson.course,
            status='active'
        ).exists()
        if not enrolled:
            raise serializers.ValidationError('Вы не записаны на этот курс.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        # Проверяем что ответ ещё не сдан
        if Submission.objects.filter(
            assignment=attrs['assignment'],
            student=request.user
        ).exists():
            raise serializers.ValidationError('Вы уже сдали это задание.')
        if not attrs.get('content') and not attrs.get('file'):
            raise serializers.ValidationError('Добавьте текст или файл ответа.')
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        return Submission.objects.create(
            student=request.user,
            **validated_data
        )


class GradeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ('score', 'feedback')

    def validate_score(self, value):
        submission = self.context.get('submission')
        if submission and value > submission.assignment.max_score:
            raise serializers.ValidationError(
                f'Оценка не может превышать {submission.assignment.max_score}.'
            )
        return value