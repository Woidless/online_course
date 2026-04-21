from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    VerifyEmailView,
    LoginView,
    LogoutView,
    MeView,
    AvatarUploadView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserBlockView,
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/verify-email/<uuid:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='password-change'),
    path('auth/password/reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Профиль
    path('me/', MeView.as_view(), name='user-me'),
    path('me/avatar/', AvatarUploadView.as_view(), name='user-avatar'),

    # Админ
    path('', AdminUserListView.as_view(), name='user-list'),
    path('<int:pk>/', AdminUserDetailView.as_view(), name='user-detail'),
    path('<int:pk>/<str:action>/', AdminUserBlockView.as_view(), name='user-block'),
]