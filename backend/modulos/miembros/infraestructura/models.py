from django.db import models
from django.conf import settings
import uuid

class ProyectoMiembroModel(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proyecto    = models.ForeignKey('proyectos.ProyectoModel', on_delete=models.CASCADE,
                                    related_name='miembros')
    usuario     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='memberships')
    agregado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, related_name='miembros_agregados')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'miembros'
        db_table  = 'project_members'
        unique_together = [['proyecto', 'usuario']]

    def __str__(self):
        return f'{self.usuario.username} → {self.proyecto.name}'
