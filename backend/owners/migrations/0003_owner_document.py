from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("owners", "0002_department_created_at_alter_department_description_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="owner",
            name="document",
            field=models.FileField(
                blank=True,
                help_text="Optional supporting file for this owner.",
                null=True,
                upload_to="owners/documents/",
            ),
        ),
    ]
