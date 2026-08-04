from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acciones', '0008_agregar_requiere_grupos_y_accion_grupos'),
    ]

    operations = [
        migrations.AddField(
            model_name='accionmodel',
            name='requiere_codigo_doxa',
            field=models.BooleanField(
                default=False,
                help_text='Si está activo, cada evidencia operativa debe registrar el código generado en Doxa.',
            ),
        ),
    ]
