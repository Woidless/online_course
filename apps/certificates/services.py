import io
from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


def generate_certificate_pdf(certificate):
    """Генерирует PDF сертификат и сохраняет в модель"""
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'Title',
        parent=styles['Title'],
        fontSize=36,
        textColor=colors.HexColor('#1a1a2e'),
        alignment=TA_CENTER,
        spaceAfter=20,
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=16,
        textColor=colors.HexColor('#4a4a6a'),
        alignment=TA_CENTER,
        spaceAfter=10,
    )

    name_style = ParagraphStyle(
        'Name',
        parent=styles['Normal'],
        fontSize=28,
        textColor=colors.HexColor('#2d6a4f'),
        alignment=TA_CENTER,
        spaceAfter=15,
    )

    course_style = ParagraphStyle(
        'Course',
        parent=styles['Normal'],
        fontSize=20,
        textColor=colors.HexColor('#1a1a2e'),
        alignment=TA_CENTER,
        spaceAfter=10,
    )

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#888888'),
        alignment=TA_CENTER,
    )

    issued_date = certificate.issued_at.strftime('%d.%m.%Y')
    verify_url = f'Код верификации: {certificate.uid}'

    story = [
        Spacer(1, 1*cm),
        Paragraph('СЕРТИФИКАТ', title_style),
        Paragraph('об успешном прохождении курса', subtitle_style),
        Spacer(1, 1*cm),
        Paragraph('Настоящим подтверждается, что', subtitle_style),
        Spacer(1, 0.5*cm),
        Paragraph(certificate.student.full_name, name_style),
        Spacer(1, 0.5*cm),
        Paragraph('успешно завершил(а) курс', subtitle_style),
        Spacer(1, 0.3*cm),
        Paragraph(f'«{certificate.course.title}»', course_style),
        Spacer(1, 1*cm),
        Paragraph(f'Дата выдачи: {issued_date}', footer_style),
        Spacer(1, 0.3*cm),
        Paragraph(verify_url, footer_style),
    ]

    doc.build(story)
    buffer.seek(0)

    filename = f'certificate_{certificate.uid}.pdf'
    certificate.pdf.save(filename, ContentFile(buffer.read()), save=True)

    return certificate