# Migracion inicial componentes (Clean Architecture)
import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('proyectos', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ComponenteModel',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('target_quantity', models.IntegerField(blank=True, null=True)),
                ('target_unit', models.CharField(blank=True, max_length=100, null=True)),
                ('display_order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='componentes', to='proyectos.proyectomodel')),
            ],
            options={
                'db_table': 'components',
                'ordering': ['display_order', 'created_at'],
            },
        ),
    ]
