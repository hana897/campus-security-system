from django.urls import path
from . import views


urlpatterns = [

    path(
        "",
        views.asset_list,
        name="asset_list"
    ),

    path(
        "add/",
        views.asset_add,
        name="asset_add"
    ),

    path(
        "<int:pk>/",
        views.asset_detail,
        name="asset_detail"
    ),
    path(
    "<int:pk>/edit/",
    views.asset_edit,
    name="asset_edit"
),
 path(
        "<int:pk>/delete/",
        views.asset_delete,
        name="asset_delete"
    ),

    path(
        "<int:pk>/",
        views.asset_detail,
        name="asset_detail"
    )
]