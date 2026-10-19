from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

from .forms import OwnerForm
from .models import Owner


@login_required(login_url="login")
def owner_list(request):
    query = request.GET.get("q", "")
    owners = Owner.objects.select_related("department")

    if query:
        owners = owners.filter(
            Q(owner_id__icontains=query)
            | Q(full_name__icontains=query)
            | Q(email__icontains=query)
            | Q(phone__icontains=query)
        )

    owners = owners.order_by("full_name")

    return render(
        request,
        "owners/owner_list.html",
        {"owners": owners, "query": query},
    )


@login_required(login_url="login")
def owner_detail(request, pk):
    owner = get_object_or_404(Owner.objects.select_related("department"), pk=pk)
    return render(request, "owners/owner_detail.html", {"owner": owner})


@login_required(login_url="login")
def owner_add(request):
    if request.method == "POST":
        form = OwnerForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect("owner_list")
    else:
        form = OwnerForm()

    return render(
        request,
        "owners/owner_form.html",
        {"form": form, "title": "Add Owner"},
    )


@login_required(login_url="login")
def owner_edit(request, pk):
    owner = get_object_or_404(Owner, pk=pk)

    if request.method == "POST":
        form = OwnerForm(request.POST, request.FILES, instance=owner)
        if form.is_valid():
            form.save()
            return redirect("owner_detail", pk=owner.pk)
    else:
        form = OwnerForm(instance=owner)

    return render(
        request,
        "owners/owner_form.html",
        {"form": form, "title": "Edit Owner"},
    )


@login_required(login_url="login")
def owner_delete(request, pk):
    owner = get_object_or_404(Owner, pk=pk)

    if request.method == "POST":
        owner.delete()
        return redirect("owner_list")

    return render(request, "owners/owner_confirm_delete.html", {"owner": owner})
