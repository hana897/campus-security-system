from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("owners", "0003_owner_document"),
    ]

    operations = [
        migrations.AlterField(
            model_name="owner",
            name="owner_type",
            field=models.CharField(
                choices=[
                    ("STUDENT", "Student"),
                    ("STAFF", "Staff"),
                    ("FACULTY", "Faculty"),
                    ("VISITOR", "Visitor"),
                    ("EMPLOYEE", "Employee"),
                ],
                max_length=20,
            ),
        ),
    ]
