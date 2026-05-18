import os
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.users.permissions import IsStudent, IsTeacherOrAdmin
from apps.courses.models import Course, Enrollment
from apps.lessons.models import Lesson, LessonProgress
from .models import Certificate
from .serializers import CertificateSerializer
from .services import generate_certificate_pdf


def check_course_completion(student, course):
    """Проверяет завершил ли студент все уроки курса"""
    total = Lesson.objects.filter(course=course, is_published=True).count()
    if total == 0:
        return False
    completed = LessonProgress.objects.filter(
        student=student,
        lesson__course=course,
        completed=True
    ).count()
    return completed >= total


class IssueCertificateView(APIView):
    """
    POST /api/certificates/issue/ — выдать сертификат студенту
    Автоматически проверяет завершение курса
    """
    permission_classes = (IsStudent,)

    def post(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response(
                {'detail': 'Укажите course_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        course = get_object_or_404(Course, pk=course_id)

        # Проверяем запись на курс
        enrolled = Enrollment.objects.filter(
            student=request.user,
            group__course=course,
            status='active'
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Вы не записаны на этот курс.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем завершение курса
        if not check_course_completion(request.user, course):
            return Response(
                {'detail': 'Вы ещё не прошли все уроки курса.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Получаем или создаём сертификат, всегда перегенерируем PDF
        cert = Certificate.objects.filter(student=request.user, course=course).first()
        if not cert:
            cert = Certificate.objects.create(student=request.user, course=course)

        generate_certificate_pdf(cert)

        return Response(
            CertificateSerializer(cert, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class MyCertificatesView(generics.ListAPIView):
    """
    GET /api/certificates/my/ — мои сертификаты
    """
    serializer_class = CertificateSerializer
    permission_classes = (IsStudent,)

    def get_queryset(self):
        return Certificate.objects.filter(
            student=self.request.user
        ).select_related('course', 'student')


class VerifyCertificateView(APIView):
    """
    GET /api/certificates/verify/<uid>/ — публичная верификация сертификата
    """
    permission_classes = (AllowAny,)

    def get(self, request, uid):
        certificate = get_object_or_404(Certificate, uid=uid)
        return Response({
            'valid': True,
            'student_name': certificate.student.full_name,
            'course_title': certificate.course.title,
            'issued_at': certificate.issued_at,
        })


class DownloadCertificateView(APIView):
    """
    GET /api/certificates/<uid>/download/ — скачать PDF сертификата
    Отправляет файл с Content-Disposition: attachment
    """
    permission_classes = (IsStudent,)

    def get(self, request, uid):
        cert = get_object_or_404(Certificate, uid=uid, student=request.user)
        if not cert.pdf or not cert.pdf.name:
            raise Http404('PDF ещё не сгенерирован.')
        try:
            filename = f'certificate_{str(cert.uid)[:8].upper()}.pdf'
            response = FileResponse(cert.pdf.open('rb'), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except FileNotFoundError:
            raise Http404('Файл не найден.')


class AdminCertificateListView(generics.ListAPIView):
    """
    GET /api/certificates/ — все сертификаты (teacher, admin)
    """
    serializer_class = CertificateSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def get_queryset(self):
        return Certificate.objects.all().select_related('student', 'course')