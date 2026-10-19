from django.db import models
from django.db.models.functions import Lower

from .validators import validate_text_content


class Department(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True,
        validators=[validate_text_content],
    )

    description = models.TextField(
        blank=True,
        null=True,
        validators=[validate_text_content],
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return self.name



class Owner(models.Model):

    OWNER_TYPES = (
        ("STUDENT", "Student"),
        ("STAFF", "Staff"),
        ("FACULTY", "Faculty"),
        ("VISITOR", "Visitor"),
        # Kept for existing records created before role-specific owner types.
        ("EMPLOYEE", "Employee"),
    )

    owner_type = models.CharField(
        max_length=20,
        choices=OWNER_TYPES
    )

    owner_id = models.CharField(
        max_length=50,
        unique=True
    )

    full_name = models.CharField(
        max_length=100,
        validators=[validate_text_content],
    )

    email = models.EmailField(
        blank=True,
        null=True
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="owners"
    )

    photo = models.ImageField(
        upload_to="owners/",
        blank=True,
        null=True
    )

    document = models.FileField(
        upload_to="owners/documents/",
        blank=True,
        null=True,
        help_text="Optional supporting file for this owner."
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                Lower("owner_id"),
                name="owner_id_case_insensitive_unique",
            ),
        ]

    def __str__(self):
        return self.full_name
