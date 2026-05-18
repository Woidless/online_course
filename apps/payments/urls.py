from django.urls import path
from .views import CreateCheckoutSessionView, PaymentListView, PaymentDetailView, PaymentConfirmView
from .webhooks import stripe_webhook

urlpatterns = [
    path('checkout/', CreateCheckoutSessionView.as_view(), name='payment-checkout'),
    path('webhook/', stripe_webhook, name='stripe-webhook'),
    path('', PaymentListView.as_view(), name='payment-list'),
    path('<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('<int:pk>/confirm/', PaymentConfirmView.as_view(), name='payment-confirm'),
]