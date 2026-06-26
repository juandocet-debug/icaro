from django.db import models
from django.conf import settings
import uuid

class EvidenciaModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    url = models.URLField(max_length=500)
    proyecto = models.ForeignKey('proyectos.ProyectoModel', on_delete=models.CASCADE, related_name='evidencias')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'evidencias'
        db_table = 'evidencias'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.nombre} ({self.proyecto.name})'


class EvidenciaActividadModel(models.Model):
    """Registro operativo creado por un asignado; sus soportes viven en UploadModel."""
    ESTADOS = (
        ('borrador', 'Borrador'),
        ('enviada', 'Enviada'),
        ('observada', 'Observada'),
        ('reabierta', 'Reabierta'),
        ('aprobada', 'Aprobada'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accion = models.ForeignKey('acciones.AccionModel', on_delete=models.CASCADE, related_name='evidencias_operativas')
    creada_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='evidencias_actividad')
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    fecha_ejecucion = models.DateField(blank=True, null=True)
    cantidad_ejecutada = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    estado = models.CharField(max_length=16, choices=ESTADOS, default='borrador', db_index=True)
    observacion_coordinador = models.TextField(blank=True, null=True)
    revisada_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name='evidencias_revisadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    grupo = models.ForeignKey('acciones.AccionGrupoModel', null=True, blank=True, on_delete=models.PROTECT, related_name='evidencias_operativas')

    class Meta:
        app_label = 'evidencias'
        db_table = 'evidencias_actividad'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['accion', 'created_at'], name='evact_accion_created_idx'),
            models.Index(fields=['estado', 'created_at'], name='evact_estado_created_idx'),
            models.Index(fields=['creada_por', 'created_at'], name='evact_user_created_idx'),
            models.Index(fields=['grupo', 'created_at'], name='evact_grupo_created_idx'),
        ]

