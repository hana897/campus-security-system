from django import forms

from .models import Owner


class OwnerForm(forms.ModelForm):
    class Meta:
        model = Owner
        fields = [
            "owner_type",
            "owner_id",
            "full_name",
            "email",
            "phone",
            "department",
            "photo",
            "document",
        ]

        widgets = {
            "owner_type": forms.Select(attrs={"class": "form-select"}),
            "owner_id": forms.TextInput(attrs={"class": "form-control"}),
            "full_name": forms.TextInput(attrs={"class": "form-control"}),
            "email": forms.EmailInput(attrs={"class": "form-control"}),
            "phone": forms.TextInput(attrs={"class": "form-control"}),
            "department": forms.Select(attrs={"class": "form-select"}),
            "photo": forms.ClearableFileInput(attrs={"class": "form-control"}),
            "document": forms.ClearableFileInput(attrs={"class": "form-control"}),
        }
