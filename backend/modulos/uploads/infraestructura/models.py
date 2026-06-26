from django.db import models
from django.conf import settings
import uuid

class UploadModel(models.Model):
    STATUS_CHOICES = (('pendiente','Pendiente'),('aprobado','Aprobado'),('rechazado','Rechazado'),)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.ForeignKey('acciones.AccionModel', on_delete=models.CASCADE, related_name='uploads')
    evidencia_actividad = models.ForeignKey(
        'evidencias.EvidenciaActividadModel', on_delete=models.CASCADE,
        related_name='soportes', null=True, blank=True,
    )
    requisito = models.ForeignKey(
        'acciones.RequisitoVerificacionAccionModel',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='uploads',
        help_text='Requisito de verificación al que corresponde esta evidencia',
    )
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploads_realizados')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploads_verificados')
    archivo = models.FileField(upload_to='evidencias/%Y/%m/', null=True, blank=True)
    file_url = models.URLField(max_length=500, blank=True, default='')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100, null=True, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente')
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    fecha_ejecucion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(null=True, blank=True)
    receipt_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'uploads'
        db_table = 'uploads'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action', 'created_at'], name='uploads_action_created_idx'),
            models.Index(fields=['requisito', 'action'], name='uploads_req_action_idx'),
            models.Index(fields=['evidencia_actividad', 'created_at'], name='uploads_evact_created_idx'),
            models.Index(fields=['status', 'created_at'], name='uploads_status_created_idx'),
            models.Index(fields=['uploaded_by', 'created_at'], name='uploads_user_created_idx'),
        ]

    def __str__(self):
        return f'Upload {self.file_name} - {self.status}'
