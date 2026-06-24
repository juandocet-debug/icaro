from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acciones', '0004_asignacionresponsableaccionmodel_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='accionmodel',
            name='tipos_evidencia_permitidos',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Nombres de tipo de evidencia permitidos. Si está vacío el operativo escribe libremente.',
            ),
        ),
    ]
