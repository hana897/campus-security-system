from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import HttpResponse

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from assets.models import Asset
from verification.models import VerificationLog


@login_required(login_url="login")
def reports_home(request):

    context = {

        "total_assets": Asset.objects.count(),

        "authorized": Asset.objects.filter(
            status="AUTHORIZED"
        ).count(),

        "lost": Asset.objects.filter(
            status="LOST"
        ).count(),

        "stolen": Asset.objects.filter(
            status="STOLEN"
        ).count(),

        "maintenance": Asset.objects.filter(
            status="MAINTENANCE"
        ).count(),

        "total_verifications": VerificationLog.objects.count(),

        "verification_logs": VerificationLog.objects.select_related(
            "asset",
            "officer"
        ).order_by("-verified_at")[:10],

    }

    return render(
        request,
        "reports/home.html",
        context
    )


@login_required(login_url="login")
def export_pdf(request):

    response = HttpResponse(
        content_type="application/pdf"
    )

    response["Content-Disposition"] = (
        'attachment; filename="CampusSecurityReport.pdf"'
    )

    doc = SimpleDocTemplate(response)

    styles = getSampleStyleSheet()

    elements = []

    elements.append(
        Paragraph(
            "<b>Campus Security System Report</b>",
            styles["Title"]
        )
    )

    elements.append(Spacer(1, 20))

    data = [

        ["Category", "Count"],

        ["Total Assets", Asset.objects.count()],

        [
            "Authorized",
            Asset.objects.filter(
                status="AUTHORIZED"
            ).count()
        ],

        [
            "Lost",
            Asset.objects.filter(
                status="LOST"
            ).count()
        ],

        [
            "Stolen",
            Asset.objects.filter(
                status="STOLEN"
            ).count()
        ],

        [
            "Maintenance",
            Asset.objects.filter(
                status="MAINTENANCE"
            ).count()
        ],

        [
            "Total Verifications",
            VerificationLog.objects.count()
        ],

    ]

    table = Table(data)

    table.setStyle(

        TableStyle([

            ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),

            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

            ("GRID", (0, 0), (-1, -1), 1, colors.black),

            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),

            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),

        ])

    )

    elements.append(table)

    elements.append(Spacer(1, 25))

    elements.append(
        Paragraph(
            "<b>Latest Verification Logs</b>",
            styles["Heading2"]
        )
    )

    logs = [["Asset", "Status", "Officer", "Date"]]

    for log in VerificationLog.objects.select_related(
        "asset",
        "officer"
    ).order_by("-verified_at")[:10]:

        logs.append([
            log.asset.asset_name,
            log.asset.status,
            str(log.officer),
            log.verified_at.strftime("%Y-%m-%d %H:%M"),
        ])

    log_table = Table(logs)

    log_table.setStyle(

        TableStyle([

            ("BACKGROUND", (0, 0), (-1, 0), colors.green),

            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

            ("GRID", (0, 0), (-1, -1), 1, colors.black),

            ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),

        ])

    )

    elements.append(log_table)

    doc.build(elements)

    return response