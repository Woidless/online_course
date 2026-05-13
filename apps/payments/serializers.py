from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    course_title = serializers.CharField(source='group.course.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'student', 'student_name',
            'group', 'group_name', 'course_title',
            'amount', 'currency',
            'status', 'status_display',
            'stripe_checkout_session_id',
            'created_at', 'paid_at',
        )
        read_only_fields = (
            'id', 'status', 'stripe_checkout_session_id',
            'stripe_payment_intent_id', 'created_at', 'paid_at',
        )


class CreateCheckoutSessionSerializer(serializers.Serializer):
    """Запрос на создание Stripe Checkout сессии"""
    group_id = serializers.IntegerField()

    def validate_group_id(self, value):
        from apps.courses.models import CourseGroup
        try:
            group = CourseGroup.objects.select_related('course').get(pk=value)
        except CourseGroup.DoesNotExist:
            raise serializers.ValidationError('Группа не найдена.')

        if group.course.is_free:
            raise serializers.ValidationError('Этот курс бесплатный.')

        if not group.course.price:
            raise serializers.ValidationError('У курса не указана цена.')

        self.context['group'] = group
        return value