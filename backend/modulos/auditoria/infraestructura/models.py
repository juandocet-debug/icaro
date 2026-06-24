from django.db import models
from django.conf import settings
import uuid

class AuditLogModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    accion = models.CharField(max_length=100)
    metodo_http = models.CharField(max_length=10)
    ruta = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    modelo_afectado = models.CharField(max_length=100, null=True, blank=True)
    objeto_id = models.CharField(max_length=100, null=True, blank=True)
    payload_changes = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'auditoria'
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        user = self.usuario.username if self.usuario else 'Anonimo'
        return f'{self.metodo_http} {self.ruta} - {user} ({self.created_at})'
