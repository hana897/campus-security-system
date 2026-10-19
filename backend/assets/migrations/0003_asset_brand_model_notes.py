from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("assets", "0002_asset_registered_by")]

    operations = [
        migrations.AddField(model_name="asset", name="brand", field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name="asset", name="model", field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name="asset", name="notes", field=models.TextField(blank=True)),
    ]
