from django.db import models
from django.conf import settings
import uuid

class TipoDocumentoModel(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proyecto    = models.ForeignKey('proyectos.ProyectoModel',
                                    on_delete=models.CASCADE,
                                    related_name='tipos_documento')
    nombre      = models.CharField(max_length=255)
    descripcion = models.TextField(null=True, blank=True)
    orden       = models.IntegerField(default=0)
    creado_por  = models.ForeignKey(settings.AUTH_USER_MODEL,
                                    on_delete=models.SET_NULL, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'tipos_documento'
        db_table  = 'project_document_types'
        ordering  = ['orden', 'created_at']

    def __str__(self):
        return f'{self.nombre} ({self.proyecto_id})'
