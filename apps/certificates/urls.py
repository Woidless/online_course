from django.urls import path
from .views import (
    IssueCertificateView,
    MyCertificatesView,
    VerifyCertificateView,
    DownloadCertificateView,
    AdminCertificateListView,
)

urlpatterns = [
    path('certificates/issue/', IssueCertificateView.as_view(), name='certificate-issue'),
    path('certificates/my/', MyCertificatesView.as_view(), name='certificate-my'),
    path('certificates/<uuid:uid>/download/', DownloadCertificateView.as_view(), name='certificate-download'),
    path('certificates/verify/<uuid:uid>/', VerifyCertificateView.as_view(), name='certificate-verify'),
    path('certificates/', AdminCertificateListView.as_view(), name='certificate-list'),
]