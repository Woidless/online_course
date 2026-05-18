import io
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from apps.lessons.models import LessonProgress

DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
DEJAVU_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def _register_fonts():
    if 'DejaVu' not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont('DejaVu', DEJAVU))
        pdfmetrics.registerFont(TTFont('DejaVu-Bold', DEJAVU_BOLD))


def _get_completion_date(certificate):
    last = LessonProgress.objects.filter(
        student=certificate.student,
        lesson__course=certificate.course,
        completed=True,
    ).order_by('-completed_at').first()
    if last and last.completed_at:
        return last.completed_at
    return certificate.issued_at


def generate_certificate_pdf(certificate):
    _register_fonts()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=2.5 * cm,
        leftMargin=2.5 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    def s(name, font='DejaVu', size=12, color='#1a1a2e', space_after=10):
        return ParagraphStyle(
            name,
            fontName=font,
            fontSize=size,
            textColor=colors.HexColor(color),
            alignment=TA_CENTER,
            spaceAfter=space_after,
            leading=size * 1.3,
        )

    completion_date = _get_completion_date(certificate).strftime('%d.%m.%Y')
    verify_code = str(certificate.uid)[:8].upper()

    story = [
        Spacer(1, 0.5 * cm),
        Paragraph('СЕРТИФИКАТ', s('t1', font='DejaVu-Bold', size=40, space_after=6)),
        Paragraph('об успешном прохождении курса', s('t2', size=15, color='#555555', space_after=20)),
        HRFlowable(width='80%', thickness=1, color=colors.HexColor('#cccccc'), spaceAfter=20),
        Paragraph('Настоящим подтверждается, что', s('t3', size=14, color='#666666', space_after=12)),
        Paragraph(certificate.student.full_name, s('name', font='DejaVu-Bold', size=30, color='#2d6a4f', space_after=12)),
        Paragraph('успешно завершил(а) курс', s('t4', size=14, color='#666666', space_after=10)),
        Paragraph(f'«{certificate.course.title}»', s('course', font='DejaVu-Bold', size=22, space_after=24)),
        HRFlowable(width='80%', thickness=1, color=colors.HexColor('#cccccc'), spaceAfter=16),
        Paragraph(f'Дата завершения: {completion_date}', s('date', size=12, color='#888888', space_after=6)),
        Paragraph(f'Код верификации: {verify_code}', s('uid', size=11, color='#aaaaaa', space_after=0)),
    ]

    doc.build(story)
    buffer.seek(0)

    filename = f'certificate_{certificate.uid}.pdf'
    certificate.pdf.save(filename, ContentFile(buffer.read()), save=True)
    return certificate
