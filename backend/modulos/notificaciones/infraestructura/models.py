from django.db import models
from django.conf import settings
import uuid

class NotificacionModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.TextField()
    leido = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'notificaciones'
        db_table = 'notificaciones'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.usuario.username} - {self.mensaje[:30]}'
