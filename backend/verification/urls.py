from django.urls import path
from . import views

urlpatterns = [
    path("", views.verify_asset, name="verify_asset"),
    path("public/", views.public_verify, name="public_verify"),
    path("history/", views.history, name="history"),
    path("scan/", views.scan_qr, name="scan_qr"),
    path("<str:asset_code>/", views.qr_verify, name="qr_verify"),
    path("requests/<int:pk>/approve/", views.approve_exit_request, name="approve_exit_request"),
    path("requests/<int:pk>/reject/", views.reject_exit_request, name="reject_exit_request"),
]