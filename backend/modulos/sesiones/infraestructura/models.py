from django.db import models
from django.conf import settings
import uuid

class SesionModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sesiones_usuario')
    token_jti = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'sesiones'
        db_table = 'sesiones'
        ordering = ['-created_at']

    def __str__(self):
        return f'Sesión {self.usuario.username} - {self.token_jti[:8]}'
