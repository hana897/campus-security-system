from django.test import TestCase


class LoginRouteTests(TestCase):
    def test_backend_root_returns_status_instead_of_login_page(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"service": "Campus Security System API", "status": "ok"},
        )

    def test_login_page_is_available_at_login_path(self):
        response = self.client.get("/login/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "accounts/login.html")
