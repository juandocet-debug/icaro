from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('evidencias', '0003_indexes_rendimiento'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='evidenciaactividadmodel',
            index=models.Index(fields=['accion', 'created_at'], name='evact_accion_created_idx'),
        ),
        migrations.AddIndex(
            model_name='evidenciaactividadmodel',
            index=models.Index(fields=['estado', 'created_at'], name='evact_estado_created_idx'),
        ),
        migrations.AddIndex(
            model_name='evidenciaactividadmodel',
            index=models.Index(fields=['creada_por', 'created_at'], name='evact_user_created_idx'),
        ),
    ]
