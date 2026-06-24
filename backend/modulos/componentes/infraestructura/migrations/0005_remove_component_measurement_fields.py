from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [('componentes', '0004_alter_componentemodel_meta')]
    operations = [
        migrations.RemoveField(model_name='componentemodel', name='target_quantity'),
        migrations.RemoveField(model_name='componentemodel', name='target_unit'),
    ]
