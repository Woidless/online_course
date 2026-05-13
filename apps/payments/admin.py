from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'student', 'group', 'amount', 'currency',
        'status', 'created_at', 'paid_at'
    )
    list_filter = ('status', 'currency')
    search_fields = ('student__email', 'student__full_name', 'group__name')
    readonly_fields = (
        'stripe_checkout_session_id',
        'stripe_payment_intent_id',
        'created_at', 'paid_at'
    )
    ordering = ('-created_at',)