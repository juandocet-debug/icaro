from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [('metas', '0001_initial')]
    operations = [
        migrations.RemoveField(model_name='metamodel', name='unidad_medida'),
        migrations.RemoveField(model_name='metamodel', name='valor_objetivo'),
    ]
