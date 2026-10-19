from django import forms
from .models import Asset


class AssetForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = [
            "asset_code",
            "asset_name",
            "serial_number",
            "category",
            "owner",
            "image",
            "status",
            "purchase_date",
        ]

        widgets = {
            "asset_code": forms.TextInput(attrs={"class": "form-control"}),
            "asset_name": forms.TextInput(attrs={"class": "form-control"}),
            "serial_number": forms.TextInput(attrs={"class": "form-control"}),
            "category": forms.Select(attrs={"class": "form-select"}),
            "owner": forms.Select(attrs={"class": "form-select"}),
            "status": forms.Select(attrs={"class": "form-select"}),
            "purchase_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control",
                }
            ),
            "image": forms.ClearableFileInput(
                attrs={"class": "form-control"}
            ),
        }