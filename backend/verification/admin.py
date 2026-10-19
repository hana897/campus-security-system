from django.contrib import admin
from .models import VerificationLog


@admin.register(VerificationLog)
class VerificationLogAdmin(admin.ModelAdmin):

    list_display = (
        "asset",
        "officer",
        "verification_method",
        "result",
        "verified_at",
    )

    search_fields = (
        "asset__asset_name",
        "asset__serial_number",
    )