from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from .forms import OwnerForm
from .models import Department


class OwnerManagementTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="owneradmin",
            password="testpass123"
        )

    def test_owner_list_page_is_accessible_for_authenticated_user(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("owner_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Owner Management")

    def test_owner_add_page_is_accessible_for_authenticated_user(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("owner_add"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Add Owner")

    def test_owner_form_rejects_digits_in_full_name(self):
        department = Department.objects.create(name="Computer Science")
        form = OwnerForm(
            data={
                "owner_type": "STUDENT",
                "owner_id": "FORM-VALIDATION-01",
                "full_name": "Student 1",
                "department": department.pk,
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("full_name", form.errors)

    def test_department_name_and_description_reject_digits(self):
        for department in (
            Department(name="Computer Science 2"),
            Department(name="Computer Science", description="Building 4"),
        ):
            with self.subTest(name=department.name, description=department.description):
                with self.assertRaises(ValidationError):
                    department.full_clean()
