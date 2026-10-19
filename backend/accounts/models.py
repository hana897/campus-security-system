from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = (
        ("SUPER_ADMIN", "Super Admin"),
        ("ADMIN", "Administrator"),
        ("SECURITY", "Security Officer"),
        ("MANAGER", "Asset Manager"),
    )


    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="SECURITY"
    )


    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    department = models.CharField(max_length=120, blank=True)


    profile_picture = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )


    def __str__(self):
        return self.username


class APIToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="api_tokens")
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"API token for {self.user.email}"
