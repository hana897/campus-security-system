from django import forms

from .models import ExitRequest


class ExitRequestForm(forms.ModelForm):
    class Meta:
        model = ExitRequest
        fields = ["reason"]
        widgets = {
            "reason": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3,
                    "placeholder": "Enter the reason for the exit request",
                }
            )
        }
