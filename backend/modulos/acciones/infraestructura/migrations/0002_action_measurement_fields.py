from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('acciones', '0001_initial')]
    operations = [
        migrations.RenameField(model_name='accionmodel', old_name='target_quantity', new_name='proyeccion_cuantitativa'),
        migrations.RenameField(model_name='accionmodel', old_name='target_unit', new_name='unidad_medida'),
        migrations.AlterField(model_name='accionmodel', name='proyeccion_cuantitativa', field=models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
        migrations.AddField(model_name='accionmodel', name='ejecucion_acumulada', field=models.DecimalField(decimal_places=2, default=0, max_digits=15)),
    ]
