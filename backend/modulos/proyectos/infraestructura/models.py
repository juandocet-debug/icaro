from django.db import models
from django.conf import settings
import os
import uuid


def portada_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return f'proyectos/portadas/{instance.pk}{ext}'

class ProyectoModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    contract_number = models.CharField(max_length=100, null=True, blank=True)
    contract_object = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, default='activo')
    public_access_token = models.CharField(max_length=100, unique=True, null=True, blank=True)
    cover_image = models.ImageField(
        upload_to=portada_upload_path,
        null=True, blank=True,
        help_text='Imagen de portada del proyecto. Máx 5MB. Formatos: jpg, png, webp.'
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'proyectos'
        db_table  = 'projects'
        indexes   = [
            models.Index(fields=['created_at'], name='projects_created_at_idx'),
            models.Index(fields=['status'],     name='projects_status_idx'),
            models.Index(fields=['created_by'], name='projects_created_by_idx'),
        ]

    def __str__(self):
        return self.name

class ProyectoDocumentoModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(ProyectoModel, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, null=True, blank=True)
    file_url = models.URLField()
    file_size = models.IntegerField(null=True, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'proyectos'
        db_table = 'project_documents'
