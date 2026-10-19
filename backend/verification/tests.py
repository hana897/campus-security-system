from django.test import TestCase
from django.urls import reverse

from accounts.models import User
from assets.models import Asset, AssetCategory
from owners.models import Department, Owner
from .models import VerificationLog


class PublicVerificationTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science")
        self.owner = Owner.objects.create(
            owner_type="STUDENT",
            owner_id="OWN001",
            full_name="Nova Abebe",
            department=self.department,
        )
        self.category = AssetCategory.objects.create(name="Laptop")
        self.asset = Asset.objects.create(
            asset_code="AST0054",
            asset_name="HP laptop",
            serial_number="SN-1001",
            category=self.category,
            owner=self.owner,
            status="AUTHORIZED",
        )

    def test_public_verification_creates_a_log_when_asset_is_found(self):
        response = self.client.post(reverse("public_verify"), {"asset_code": self.asset.asset_code})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Asset found")
        self.assertTrue(
            VerificationLog.objects.filter(
                asset=self.asset,
                verification_method="ASSET_CODE",
                remarks="Public gate verification",
            ).exists()
        )
