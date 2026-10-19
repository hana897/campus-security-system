from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from assets.models import Asset
from verification.models import VerificationLog


@login_required(login_url="login")
def dashboard_home(request):

    context = {

        "total_assets": Asset.objects.count(),

        "authorized_assets": Asset.objects.filter(
            status="AUTHORIZED"
        ).count(),

        "lost_assets": Asset.objects.filter(
            status="LOST"
        ).count(),

        "stolen_assets": Asset.objects.filter(
            status="STOLEN"
        ).count(),

        "maintenance_assets": Asset.objects.filter(
            status="MAINTENANCE"
        ).count(),

        "recent_verifications": VerificationLog.objects.all()
        .order_by("-verified_at")[:5],

    }


    return render(
        request,
        "dashboard/home.html",
        context
    )