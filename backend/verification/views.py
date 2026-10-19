from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from accounts.decorators import security_required
from assets.models import Asset
from .forms import ExitRequestForm
from .models import ExitRequest, VerificationLog


def public_verify(request):
    asset = None
    message = None

    if request.method == "POST":
        asset_code = request.POST.get("asset_code", "").strip()
        if asset_code:
            try:
                asset = Asset.objects.select_related("category", "owner").get(asset_code=asset_code)
                VerificationLog.objects.create(
                    asset=asset,
                    officer=None,
                    verification_method="ASSET_CODE",
                    result=asset.status,
                    remarks="Public gate verification",
                )
                message = "Asset found. Please proceed with security review."
            except Asset.DoesNotExist:
                message = "Asset not found."

    return render(request, "verification/public_verify.html", {"asset": asset, "message": message})


@login_required(login_url="login")
@security_required
def scan_qr(request):
    message = None

    if request.method == "POST":
        asset_code = request.POST.get("asset_code", "").strip()
        if asset_code:
            return redirect("qr_verify", asset_code=asset_code)
        message = "Please enter a valid asset code."

    return render(request, "verification/scan.html", {"message": message})


@login_required(login_url="login")
@security_required
def history(request):
    logs = VerificationLog.objects.select_related("asset", "officer").all().order_by("-verified_at")
    return render(request, "verification/history.html", {"logs": logs})


@login_required(login_url="login")
@security_required
def verify_asset(request):
    asset = None
    message = None
    form = ExitRequestForm()

    if request.method == "POST":
        search = request.POST.get("search")
        form = ExitRequestForm(request.POST)

        try:
            asset = Asset.objects.select_related("category", "owner").get(asset_code=search)
            VerificationLog.objects.create(
                asset=asset,
                officer=request.user if request.user.is_authenticated else None,
                verification_method="ASSET_CODE",
                result=asset.status,
                remarks="Manual asset code verification",
            )

            if asset.status == "AUTHORIZED":
                ExitRequest.objects.create(
                    asset=asset,
                    requested_by=request.user if request.user.is_authenticated else None,
                    reason=form.data.get("reason", ""),
                    status="PENDING",
                )
                message = "Temporary exit check created successfully."
            else:
                message = "Asset is not eligible for temporary exit authorization."

        except Asset.DoesNotExist:
            message = "Asset not found."

    return render(
        request,
        "verification/search.html",
        {"asset": asset, "message": message, "form": form},
    )


@login_required(login_url="login")
@security_required
def qr_verify(request, asset_code):
    try:
        asset = Asset.objects.select_related("category", "owner").get(asset_code=asset_code)
        VerificationLog.objects.create(
            asset=asset,
            officer=request.user if request.user.is_authenticated else None,
            verification_method="QR_CODE",
            result=asset.status,
            remarks="QR code verification",
        )

        request_obj = ExitRequest.objects.filter(asset=asset).order_by("-requested_at").first()
        return render(
            request,
            "verification/result.html",
            {"asset": asset, "request_obj": request_obj},
        )
    except Asset.DoesNotExist:
        return render(request, "verification/result.html", {"asset": None})


@login_required(login_url="login")
@security_required
def approve_exit_request(request, pk):
    exit_request = get_object_or_404(ExitRequest, pk=pk)
    exit_request.status = "APPROVED"
    exit_request.approved_by = request.user
    exit_request.approved_at = timezone.now()
    exit_request.remarks = "Approved by security officer"
    exit_request.save()

    VerificationLog.objects.create(
        asset=exit_request.asset,
        officer=request.user,
        verification_method="QR_CODE",
        result="APPROVED",
        remarks="Exit request approved",
    )

    return redirect("verify_asset")


@login_required(login_url="login")
@security_required
def reject_exit_request(request, pk):
    exit_request = get_object_or_404(ExitRequest, pk=pk)
    exit_request.status = "REJECTED"
    exit_request.approved_by = request.user
    exit_request.approved_at = timezone.now()
    exit_request.remarks = "Rejected by security officer"
    exit_request.save()

    VerificationLog.objects.create(
        asset=exit_request.asset,
        officer=request.user,
        verification_method="QR_CODE",
        result="REJECTED",
        remarks="Exit request rejected",
    )

    return redirect("verify_asset")