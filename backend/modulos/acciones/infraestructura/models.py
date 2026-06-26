from django.db import models
from django.conf import settings
import uuid


class AccionModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    component = models.ForeignKey('componentes.ComponenteModel', on_delete=models.CASCADE, related_name='acciones')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    action_type = models.CharField(max_length=50, null=True, blank=True)
    total_sessions = models.IntegerField(default=1)
    proyeccion_cuantitativa = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    unidad_medida = models.CharField(max_length=100, null=True, blank=True)
    ejecucion_acumulada = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_transversal = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    tipos_evidencia_permitidos = models.JSONField(
        default=list, blank=True,
        help_text='Nombres de tipo de evidencia permitidos. Si está vacío el operativo escribe libremente.',
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    requiere_grupos = models.BooleanField(default=False)

    class Meta:
        app_label = 'acciones'
        db_table = 'actions'
        ordering = ['display_order', 'created_at']
        indexes = [
            models.Index(fields=['display_order'], name='action_display_order_idx'),
            models.Index(fields=['ejecucion_acumulada', 'proyeccion_cuantitativa'], name='action_avance_idx'),
        ]

    def __str__(self):
        return self.name


class AccionGrupoModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accion = models.ForeignKey(AccionModel, on_delete=models.CASCADE, related_name='grupos')
    nombre = models.CharField(max_length=255)
    codigo = models.CharField(max_length=100, null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'acciones'
        db_table = 'accion_grupos'
        ordering = ['nombre', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['accion', 'nombre'],
                condition=models.Q(activo=True),
                name='unique_active_group_name'
            )
        ]
        indexes = [
            models.Index(fields=['accion', 'activo'], name='group_accion_activo_idx'),
            models.Index(fields=['accion', 'nombre'], name='group_accion_nombre_idx'),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})" if self.codigo else self.nombre



class RequisitoVerificacionAccionModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accion = models.ForeignKey(AccionModel, on_delete=models.CASCADE, related_name='requisitos')
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
    obligatorio = models.BooleanField(default=True)
    tipos_archivo_permitidos = models.JSONField(default=list)
    min_archivos = models.PositiveIntegerField(default=1)
    max_archivos = models.PositiveIntegerField(null=True, blank=True)
    orden = models.PositiveIntegerField(default=0)
    activo = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'acciones'
        db_table = 'accion_requisitos_verificacion'
        ordering = ['orden', 'created_at']

    def __str__(self):
        return f'{self.nombre}'


class AsignacionResponsableAccionModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accion = models.ForeignKey(AccionModel, on_delete=models.CASCADE, related_name='responsables')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asignaciones_acciones')
    tipo_asignacion = models.CharField(max_length=20, choices=[('responsable', 'Responsable'), ('apoyo', 'Apoyo')], default='responsable')
    activo = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='asignaciones_otorgadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'acciones'
        db_table = 'accion_responsables'
        constraints = [
            models.UniqueConstraint(
                fields=['accion', 'usuario'],
                condition=models.Q(activo=True),
                name='unique_active_assignment'
            )
        ]

    def __str__(self):
        return f'{self.usuario.username} - {self.accion.name} ({self.tipo_asignacion})'


class HistorialEjecucionAccionModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accion = models.ForeignKey(AccionModel, on_delete=models.CASCADE, related_name='historial_ejecucion')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reportes_ejecucion')
    cantidad = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'acciones'
        db_table = 'accion_historial_ejecucion'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.usuario.username} agregó {self.cantidad} a {self.accion.name}'
