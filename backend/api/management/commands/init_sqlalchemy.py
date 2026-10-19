from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create the SQLAlchemy application tables beside the existing Django tables."

    def handle(self, *args, **options):
        from api.sql_store import ensure_tables

        ensure_tables()
        self.stdout.write(self.style.SUCCESS("SQLAlchemy tables are ready in the configured database."))
