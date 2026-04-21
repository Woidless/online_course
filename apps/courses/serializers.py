from rest_framework import serializers
from .models import Course, CourseGroup, Enrollment
from apps.users.serializers import UserProfileSerializer


class CourseSerializer(serializers.ModelSerializer):
    teacher = UserProfileSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        source='teacher',
        queryset=__import__('apps.users.models', fromlist=['User']).User.objects.filter(role='teacher'),
        write_only=True
    )
    lessons_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'description', 'cover',
            'teacher', 'teacher_id',
            'is_published', 'lessons_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_lessons_count(self, obj):
        return obj.lessons.filter(is_published=True).count()


class CourseGroupSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = CourseGroup
        fields = (
            'id', 'course', 'course_title',
            'name', 'teacher', 'teacher_name',
            'starts_at', 'ends_at',
            'students_count', 'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_students_count(self, obj):
        return obj.enrollments.filter(status='active').count()


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    course_title = serializers.CharField(source='group.course.title', read_only=True)

    class Meta:
        model = Enrollment
        fields = (
            'id', 'student', 'student_name',
            'group', 'group_name', 'course_title',
            'status', 'enrolled_at',
        )
        read_only_fields = ('id', 'enrolled_at')


class EnrollStudentSerializer(serializers.Serializer):
    """Для записи студента в группу"""
    student_id = serializers.IntegerField()
    group_id = serializers.IntegerField()

    def validate(self, attrs):
        from apps.users.models import User
        from .models import CourseGroup

        try:
            student = User.objects.get(pk=attrs['student_id'], role='student')
        except User.DoesNotExist:
            raise serializers.ValidationError({'student_id': 'Студент не найден.'})

        try:
            group = CourseGroup.objects.get(pk=attrs['group_id'])
        except CourseGroup.DoesNotExist:
            raise serializers.ValidationError({'group_id': 'Группа не найдена.'})

        if Enrollment.objects.filter(student=student, group=group).exists():
            raise serializers.ValidationError('Студент уже записан в эту группу.')

        attrs['student'] = student
        attrs['group'] = group
        return attrs