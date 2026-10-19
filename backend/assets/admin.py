from django.contrib import admin
from django.utils.html import format_html
from .models import Asset, AssetCategory


@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "description",
    )


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):

    list_display = (
        "asset_code",
        "asset_name",
        "category",
        "owner",
        "status",
        "qr_preview",
    )

    readonly_fields = (
        "qr_preview",
    )

    search_fields = (
        "asset_code",
        "serial_number",
        "asset_name",
    )

    def qr_preview(self, obj):
        if obj.qr_code:
            return format_html(
                '<img src="{}" width="150" height="150" />',
                obj.qr_code.url
            )
        return "No QR Code"

    qr_preview.short_description = "QR Code"