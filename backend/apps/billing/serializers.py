from rest_framework import serializers

from .models import Plan, Subscription


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = (
            "id",
            "code",
            "name",
            "price_cents",
            "interval",
            "metadata",
            "is_active",
        )
        read_only_fields = fields


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_code = serializers.SlugRelatedField(
        source="plan",
        slug_field="code",
        queryset=Plan.objects.filter(is_active=True),
        write_only=True,
        required=False,
    )
    plan_detail = PlanSerializer(source="plan", read_only=True)

    class Meta:
        model = Subscription
        fields = (
            "id",
            "plan",
            "plan_code",
            "plan_detail",
            "status",
            "stripe_customer_id",
            "stripe_subscription_id",
            "current_period_start",
            "current_period_end",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "plan",
            "plan_detail",
            "stripe_customer_id",
            "stripe_subscription_id",
            "current_period_start",
            "current_period_end",
            "created_at",
            "updated_at",
        )

    def update(self, instance, validated_data):
        plan = validated_data.pop("plan", None)
        if plan is not None:
            instance.plan = plan
            if instance.status == Subscription.Status.CANCELED:
                instance.status = Subscription.Status.ACTIVE
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
