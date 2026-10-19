from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("auth/login/", views.auth_login_api, name="api_login"),
    path("auth/me/", views.auth_me_api, name="api_auth_me"),
    path("auth/change-password/", views.auth_change_password_api, name="api_change_password"),
    path("profile/", views.profile_update_api, name="api_profile"),
    path("users/", views.user_list_api, name="api_users"),
    path("users/<int:user_id>/", views.user_detail_api, name="api_user_detail"),

    # Assets
    path("assets/", views.asset_list_api, name="api_assets"),
    path("assets/<str:code>/", views.asset_detail_api, name="api_asset_detail"),

    # Owners
    path("owners/", views.owner_list_api, name="api_owners"),
    path("owners/<int:owner_id>/", views.owner_detail_api, name="api_owner_detail"),

    # Verification & Exit passes
    path("verification/verify/", views.verify_asset_api, name="api_verify_asset"),
    path("verification/history/", views.verification_history_api, name="api_verification_history"),
    path("exit-passes/", views.exit_pass_api, name="api_exit_passes"),

    # Reports
    path("reports/overview/", views.reports_overview_api, name="api_reports_overview"),
    path("reports/export/<str:file_format>/", views.reports_export_api, name="api_reports_export"),
    path("incidents/", views.incidents_api, name="api_incidents"),
    path("incidents/<int:incident_id>/", views.incident_detail_api, name="api_incident_detail"),
    path("settings/", views.user_settings_api, name="api_user_settings"),
    path("notifications/", views.notifications_api, name="api_notifications"),
    path("notifications/<int:notification_id>/", views.notification_detail_api, name="api_notification_detail"),
    path("gates/", views.gates_api, name="api_gates"),
    path("lookups/", views.lookup_data_api, name="api_lookups"),
    path("files/<int:file_id>/", views.stored_file_api, name="api_stored_file"),
]
