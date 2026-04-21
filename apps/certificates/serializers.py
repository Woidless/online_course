from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    verify_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            'id', 'uid',
            'student', 'student_name',
            'course', 'course_title',
            'pdf', 'issued_at',
            'verify_url',
        )
        read_only_fields = ('id', 'uid', 'pdf', 'issued_at')

    def get_verify_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/certificates/verify/{obj.uid}/')
        return f'/api/certificates/verify/{obj.uid}/'
    