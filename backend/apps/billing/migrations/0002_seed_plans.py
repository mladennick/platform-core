from django.db import migrations


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    defaults = [
        {
            "code": "free",
            "name": "Free",
            "price_cents": 0,
            "interval": "monthly",
            "metadata": {"seats": 3},
        },
        {
            "code": "pro",
            "name": "Pro",
            "price_cents": 2900,
            "interval": "monthly",
            "metadata": {"seats": 25},
        },
        {
            "code": "business",
            "name": "Business",
            "price_cents": 9900,
            "interval": "monthly",
            "metadata": {"seats": 100},
        },
    ]
    for item in defaults:
        Plan.objects.update_or_create(code=item["code"], defaults=item)


def unseed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    Plan.objects.filter(code__in=["free", "pro", "business"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plans, unseed_plans),
    ]
