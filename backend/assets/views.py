from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render, get_object_or_404, redirect

from .models import Asset
from .forms import AssetForm


@login_required(login_url="login")
def asset_list(request):

    query = request.GET.get("q", "")

    assets = Asset.objects.select_related(
        "category",
        "owner"
    )

    if query:
        assets = assets.filter(
            Q(asset_code__icontains=query) |
            Q(asset_name__icontains=query) |
            Q(serial_number__icontains=query)
        )

    assets = assets.order_by("asset_code")

    context = {
        "assets": assets,
        "query": query,
    }

    return render(
        request,
        "assets/asset_list.html",
        context
    )


@login_required(login_url="login")
def asset_detail(request, pk):

    asset = get_object_or_404(
        Asset.objects.select_related(
            "category",
            "owner"
        ),
        pk=pk
    )

    return render(
        request,
        "assets/asset_detail.html",
        {
            "asset": asset
        }
    )


@login_required(login_url="login")
def asset_add(request):

    if request.method == "POST":

        form = AssetForm(
            request.POST,
            request.FILES
        )

        if form.is_valid():

            form.save()

            return redirect("asset_list")

    else:

        form = AssetForm()

    return render(
        request,
        "assets/asset_form.html",
        {
            "form": form,
            "title": "Add Asset",
        }
    )
@login_required(login_url="login")
def asset_edit(request, pk):

    asset = get_object_or_404(
        Asset,
        pk=pk
    )

    if request.method == "POST":

        form = AssetForm(
            request.POST,
            request.FILES,
            instance=asset
        )

        if form.is_valid():

            form.save()

            return redirect("asset_detail", pk=asset.pk)

    else:

        form = AssetForm(instance=asset)

    return render(
        request,
        "assets/asset_form.html",
        {
            "form": form,
            "title": "Edit Asset",
        }
    )
@login_required(login_url="login")
def asset_delete(request, pk):

    asset = get_object_or_404(
        Asset,
        pk=pk
    )

    if request.method == "POST":

        asset.delete()

        return redirect("asset_list")

    return render(
        request,
        "assets/asset_confirm_delete.html",
        {
            "asset": asset
        }
    )