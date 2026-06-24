from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('uploads', '0002_add_requisito_fk_and_archivo_field')]

    operations = [
        migrations.AddField(
            model_name='uploadmodel',
            name='fecha_ejecucion',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='uploadmodel',
            name='observaciones',
            field=models.TextField(blank=True, null=True),
        ),
    ]
