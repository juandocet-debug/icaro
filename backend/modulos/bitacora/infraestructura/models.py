from django.db import models
from django.conf import settings
import uuid

class BitacoraModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    descripcion = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'bitacora'
        db_table = 'bitacora'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.created_at} - {self.descripcion[:30]}'
