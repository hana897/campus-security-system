from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
import mimetypes

from owners.models import Owner


class Command(BaseCommand):
    help = "Copy existing account and owner profile photos into SQLAlchemy database storage."

    def handle(self, *args, **options):
        from api.sql_store import StoredFile, SessionLocal, ensure_tables

        ensure_tables()
        User = get_user_model()
        migrated = 0
        with SessionLocal() as session:
            for user in User.objects.exclude(profile_picture="").iterator():
                exists = session.query(StoredFile.id).filter_by(user_id=user.pk, kind="profile").first()
                if exists:
                    continue
                with user.profile_picture.open("rb") as photo:
                    content = photo.read()
                if content:
                    session.add(StoredFile(user_id=user.pk, kind="profile", file_name=user.profile_picture.name.rsplit("/", 1)[-1][:255], mime_type=mimetypes.guess_type(user.profile_picture.name)[0] or "application/octet-stream", content=content))
                    migrated += 1
            for owner in Owner.objects.exclude(photo="").iterator():
                exists = session.query(StoredFile.id).filter_by(owner_id=owner.pk, kind="owner-photo").first()
                if exists:
                    continue
                with owner.photo.open("rb") as photo:
                    content = photo.read()
                if content:
                    session.add(StoredFile(owner_id=owner.pk, kind="owner-photo", file_name=owner.photo.name.rsplit("/", 1)[-1][:255], mime_type=mimetypes.guess_type(owner.photo.name)[0] or "application/octet-stream", content=content))
                    migrated += 1
            session.commit()
        self.stdout.write(self.style.SUCCESS(f"Copied {migrated} existing profile photo(s) into database storage."))
