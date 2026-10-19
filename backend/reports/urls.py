from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.reports_home,
        name="reports"
    ),

    path(
        "pdf/",
        views.export_pdf,
        name="reports_pdf"
    ),

]