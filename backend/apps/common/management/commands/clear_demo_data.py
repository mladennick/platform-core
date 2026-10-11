from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.organizations.models import Organization

User = get_user_model()

DEMO_USERNAMES = ("admin", "member1")
DEMO_ORG_NAMES = ("Acme Corp",)
DEMO_ORG_DOMAINS = ("acme.test",)


class Command(BaseCommand):
    help = "Remove local smoke-test demo data (Acme Corp / admin / member1)."

    @transaction.atomic
    def handle(self, *args, **options):
        users_deleted, _ = User.objects.filter(username__in=DEMO_USERNAMES).delete()
        orgs = Organization.all_objects.filter(name__in=DEMO_ORG_NAMES) | Organization.all_objects.filter(
            domain__in=DEMO_ORG_DOMAINS
        )
        orgs_deleted, _ = orgs.distinct().delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Removed demo users={users_deleted}, organizations={orgs_deleted}."
            )
        )
