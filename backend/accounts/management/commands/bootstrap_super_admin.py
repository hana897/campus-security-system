import secrets
import string

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create the initial super-admin account and generate a one-time password."

    def add_arguments(self, parser):
        parser.add_argument("--email", default="superadmin@scsams.edu")

    def handle(self, *args, **options):
        User = get_user_model()
        email = options["email"].strip().lower()
        if User.objects.filter(role="SUPER_ADMIN").exists():
            raise CommandError("A super-admin account already exists. Use its credentials or reset its password securely.")
        if User.objects.filter(email__iexact=email).exists():
            raise CommandError("That email address is already assigned to another account.")

        alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
        password = "".join(secrets.choice(alphabet) for _ in range(24))
        user = User.objects.create_superuser(
            username=email,
            email=email,
            password=password,
            first_name="Campus",
            last_name="Super Admin",
            role="SUPER_ADMIN",
            department="Campus Security Administration",
        )
        self.stdout.write(self.style.SUCCESS("Super-admin account created."))
        self.stdout.write(f"Email: {user.email}")
        self.stdout.write(f"Temporary password: {password}")
        self.stdout.write("Store this password securely. It will not be shown again.")
