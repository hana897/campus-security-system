from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def backend_status(request):
    return JsonResponse({"service": "Campus Security System API", "status": "ok"})

urlpatterns = [

    path("", backend_status, name="backend_status"),

    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "",
        include("accounts.urls")
    ),

    path(
        "dashboard/",
        include("dashboard.urls")
    ),

    path(
        "verification/",
        include("verification.urls")
    ),
    path(
        "reports/",
        include("reports.urls")
    ),
    path(
        "assets/",
        include("assets.urls")
    ),
    path(
        "owners/",
        include("owners.urls")
    ),
    path(
        "api/",
        include("api.urls")
    ),

]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )