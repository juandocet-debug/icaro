from django.db import models
from django.conf import settings
import uuid

class MetaModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proyecto = models.ForeignKey('proyectos.ProyectoModel', on_delete=models.CASCADE, related_name='metas')
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='metas_creadas')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='metas_actualizadas')

    class Meta:
        app_label = 'metas'
        db_table = 'metas'
        indexes = [
            models.Index(fields=['proyecto']),
            models.Index(fields=['activo']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['created_at']

    def __str__(self):
        return self.nombre
