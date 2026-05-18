from rest_framework import serializers
from .models import Assignment, Submission, Grade


class AssignmentSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_colab_url = serializers.CharField(source='lesson.colab_url', read_only=True, allow_null=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            'id', 'lesson', 'lesson_title', 'lesson_colab_url',
            'title', 'description',
            'due_date', 'submissions_count',
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
        fields = ('id', 'feedback', 'teacher_name', 'graded_at')
        read_only_fields = ('id', 'graded_at', 'teacher_name')


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    grade = GradeSerializer(read_only=True)

    class Meta:
        model = Submission
        fields = (
            'id', 'assignment', 'assignment_title',
            'student', 'student_name',
            'content', 'file', 'status',
            'grade',
            'submitted_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'student', 'status',
            'submitted_at', 'updated_at',
        )


ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf',
    '.xls', '.xlsx', '.ods', '.csv',
    '.ppt', '.pptx', '.odp',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.py', '.js', '.ts', '.html', '.css', '.java',
    '.cpp', '.c', '.cs', '.rb', '.php', '.go',
    '.ipynb', '.md',
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ('assignment', 'content', 'file')

    def validate_file(self, value):
        if value is None:
            return value
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                'Файл слишком большой. Максимальный размер: 10 МБ.'
            )
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f'Неподдерживаемый формат файла «{ext}». '
                'Разрешены: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, JPG, PNG, ZIP, PY, IPYNB и другие.'
            )
        return value

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
        fields = ('feedback',)

    def create(self, validated_data):
        return Grade.objects.create(score=0, **validated_data)