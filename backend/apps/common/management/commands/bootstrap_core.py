from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.organizations.models import Organization

User = get_user_model()


class Command(BaseCommand):
    help = "Create the first Organization and ADMIN user for a fresh environment."

    def add_arguments(self, parser):
        parser.add_argument("--org-name", required=True)
        parser.add_argument("--username", required=True)
        parser.add_argument("--email", default="")
        parser.add_argument("--password", required=True)
        parser.add_argument("--domain", default=None)

    @transaction.atomic
    def handle(self, *args, **options):
        username = options["username"]
        if User.objects.filter(username=username).exists():
            raise CommandError(f"User '{username}' already exists.")

        domain = options["domain"] or None
        if domain and Organization.all_objects.filter(domain=domain).exists():
            raise CommandError(f"Organization domain '{domain}' already exists.")

        org = Organization.objects.create(
            name=options["org_name"],
            domain=domain,
        )
        user = User.objects.create_user(
            username=username,
            email=options["email"] or "",
            password=options["password"],
            organization=org,
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Created org '{org.name}' ({org.id}) and ADMIN '{user.username}'."
            )
        )
