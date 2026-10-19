from django.db import models

from assets.models import Asset
from accounts.models import User


class ExitRequest(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="exit_requests")
    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requested_exit_requests",
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_exit_requests",
    )
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.asset.asset_code} - {self.status}"


class VerificationLog(models.Model):

    METHOD_CHOICES = (
        ("QR_CODE", "QR Code"),
        ("ASSET_CODE", "Asset Code"),
        ("SERIAL_NUMBER", "Serial Number"),
        ("OCR", "OCR"),
    )


    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE
    )


    officer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )


    verification_method = models.CharField(
        max_length=50,
        choices=METHOD_CHOICES
    )


    result = models.CharField(
        max_length=50
    )


    remarks = models.TextField(
        blank=True,
        null=True
    )


    verified_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return f"{self.asset.asset_code} - {self.result}"