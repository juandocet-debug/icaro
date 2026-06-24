from django.db import models
from django.conf import settings
import uuid

class RolModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=100, unique=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField()
    es_sistema = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    tipo_alcance = models.CharField(max_length=50, default='proyecto')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'roles'
        db_table = 'roles'

    def __str__(self):
        return self.nombre


class PermisoModel(models.Model):
    codigo = models.CharField(max_length=100, primary_key=True)
    nombre = models.CharField(max_length=100)
    modulo = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'roles'
        db_table = 'permisos'

    def __str__(self):
        return f"{self.modulo}:{self.codigo}"


class RolPermisoModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rol = models.ForeignKey(RolModel, on_delete=models.CASCADE, related_name='permisos_rel')
    permiso = models.ForeignKey(PermisoModel, on_delete=models.CASCADE)

    class Meta:
        app_label = 'roles'
        db_table = 'rol_permisos'
        unique_together = [['rol', 'permiso']]


class UsuarioRolModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='usuario_roles')
    rol = models.ForeignKey(RolModel, on_delete=models.CASCADE, related_name='usuario_roles')
    
    # Alcances jerárquicos opcionales
    proyecto = models.ForeignKey('proyectos.ProyectoModel', on_delete=models.CASCADE, null=True, blank=True)
    componente = models.ForeignKey('componentes.ComponenteModel', on_delete=models.CASCADE, null=True, blank=True)
    accion = models.ForeignKey('acciones.AccionModel', on_delete=models.CASCADE, null=True, blank=True)
    
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'roles'
        db_table = 'usuario_roles'
        constraints = [
            models.UniqueConstraint(
                fields=['usuario', 'rol', 'proyecto', 'componente', 'accion', 'activo'],
                nulls_distinct=False,
                name='unique_usuario_rol_proyecto_componente_accion_activo'
            )
        ]

    def __str__(self):
        return f"{self.usuario.username} - {self.rol.nombre}"
