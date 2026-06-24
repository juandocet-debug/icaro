# Migracion inicial uploads (Clean Architecture)
import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('acciones', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UploadModel',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('file_url', models.URLField(max_length=500)),
                ('file_name', models.CharField(max_length=255)),
                ('file_type', models.CharField(blank=True, max_length=50, null=True)),
                ('file_size', models.IntegerField(blank=True, null=True)),
                ('status', models.CharField(choices=[('pendiente','Pendiente'),('aprobado','Aprobado'),('rechazado','Rechazado')], default='pendiente', max_length=20)),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
                ('rejection_reason', models.TextField(blank=True, null=True)),
                ('receipt_number', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('action', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='uploads', to='acciones.accionmodel')),
                ('uploaded_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='uploads_realizados', to=settings.AUTH_USER_MODEL)),
                ('verified_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploads_verificados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'uploads',
                'ordering': ['-created_at'],
            },
        ),
    ]
