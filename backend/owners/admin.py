from django.contrib import admin
from .models import Department, Owner


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "description",
        "created_at",
    )


@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = (
        "owner_id",
        "full_name",
        "owner_type",
        "department",
        "phone",
    )

    search_fields = (
        "owner_id",
        "full_name",
    )