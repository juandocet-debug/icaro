from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('uploads', '0004_uploadmodel_evidencia_actividad'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='uploadmodel',
            index=models.Index(fields=['action', 'created_at'], name='uploads_action_created_idx'),
        ),
        migrations.AddIndex(
            model_name='uploadmodel',
            index=models.Index(fields=['requisito', 'action'], name='uploads_req_action_idx'),
        ),
        migrations.AddIndex(
            model_name='uploadmodel',
            index=models.Index(fields=['evidencia_actividad', 'created_at'], name='uploads_evact_created_idx'),
        ),
        migrations.AddIndex(
            model_name='uploadmodel',
            index=models.Index(fields=['status', 'created_at'], name='uploads_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='uploadmodel',
            index=models.Index(fields=['uploaded_by', 'created_at'], name='uploads_user_created_idx'),
        ),
    ]
