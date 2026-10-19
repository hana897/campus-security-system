from django.urls import path

from . import views

urlpatterns = [
    path("", views.owner_list, name="owner_list"),
    path("add/", views.owner_add, name="owner_add"),
    path("<int:pk>/", views.owner_detail, name="owner_detail"),
    path("<int:pk>/edit/", views.owner_edit, name="owner_edit"),
    path("<int:pk>/delete/", views.owner_delete, name="owner_delete"),
]
