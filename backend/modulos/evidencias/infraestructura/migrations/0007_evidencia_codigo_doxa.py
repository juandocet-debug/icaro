from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('evidencias', '0006_grupo_fk_protect_to_set_null'),
    ]

    operations = [
        migrations.AddField(
            model_name='evidenciaactividadmodel',
            name='codigo_doxa',
            field=models.CharField(blank=True, db_index=True, max_length=16, null=True),
        ),
    ]
