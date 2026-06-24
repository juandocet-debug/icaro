from typing import List, Optional
from django.db import transaction
from modulos.acciones.dominio.AsignacionResponsable import AsignacionResponsable
from modulos.acciones.dominio.AsignacionResponsableRepositoryPort import AsignacionResponsableRepositoryPort
from modulos.acciones.infraestructura.models import AsignacionResponsableAccionModel

class DjangoAsignacionResponsableRepository(AsignacionResponsableRepositoryPort):
    def _to_domain(self, obj: AsignacionResponsableAccionModel) -> AsignacionResponsable:
        return AsignacionResponsable(
            id=str(obj.id),
            accion_id=str(obj.accion_id),
            usuario_id=obj.usuario_id,
            tipo_asignacion=obj.tipo_asignacion,
            activo=obj.activo,
            assigned_by_id=obj.assigned_by_id,
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )

    def guardar(self, asignacion: AsignacionResponsable) -> AsignacionResponsable:
        if asignacion.id:
            obj = AsignacionResponsableAccionModel.objects.get(pk=asignacion.id)
            obj.tipo_asignacion = asignacion.tipo_asignacion
            obj.activo = asignacion.activo
            obj.assigned_by_id = asignacion.assigned_by_id
            obj.save()
        else:
            obj = AsignacionResponsableAccionModel.objects.create(
                accion_id=asignacion.accion_id,
                usuario_id=asignacion.usuario_id,
                tipo_asignacion=asignacion.tipo_asignacion,
                activo=asignacion.activo,
                assigned_by_id=asignacion.assigned_by_id
            )
        return self._to_domain(obj)

    def obtener_por_id(self, asignacion_id: str) -> Optional[AsignacionResponsable]:
        try:
            obj = AsignacionResponsableAccionModel.objects.get(pk=asignacion_id)
            return self._to_domain(obj)
        except AsignacionResponsableAccionModel.DoesNotExist:
            return None

    def buscar_activas_por_accion(self, accion_id: str) -> List[AsignacionResponsable]:
        qs = AsignacionResponsableAccionModel.objects.filter(accion_id=accion_id, activo=True).select_related('usuario', 'usuario__profile')
        return [self._to_domain(x) for x in qs]

    def buscar_activas_por_usuario(self, usuario_id: int) -> List[AsignacionResponsable]:
        qs = AsignacionResponsableAccionModel.objects.filter(usuario_id=usuario_id, activo=True)
        return [self._to_domain(x) for x in qs]

    def desactivar_por_usuario(self, usuario_id: int) -> None:
        AsignacionResponsableAccionModel.objects.filter(usuario_id=usuario_id, activo=True).update(activo=False)

    def desactivar_por_proyecto_usuario(self, proyecto_id: str, usuario_id: int) -> None:
        AsignacionResponsableAccionModel.objects.filter(
            usuario_id=usuario_id,
            activo=True,
            accion__component__project_id=proyecto_id
        ).update(activo=False)

    def buscar_miembros_asignables(self, accion_id: str, q: str = "") -> list:
        from modulos.acciones.infraestructura.models import AccionModel
        from modulos.miembros.infraestructura.models import ProyectoMiembroModel
        from modulos.roles.infraestructura.models import UsuarioRolModel
        from django.contrib.auth import get_user_model
        from django.db.models import Q

        User = get_user_model()
        try:
            accion = AccionModel.objects.select_related('component').get(pk=accion_id)
        except AccionModel.DoesNotExist:
            raise ValueError("Acción no encontrada.")

        proyecto_id = accion.component.project_id
        miembros_ids = ProyectoMiembroModel.objects.filter(
            proyecto_id=proyecto_id
        ).values_list('usuario_id', flat=True)
        con_rol = UsuarioRolModel.objects.filter(
            proyecto_id=proyecto_id, usuario_id__in=miembros_ids, activo=True
        ).values_list('usuario_id', flat=True).distinct()

        qs = User.objects.filter(id__in=con_rol, is_active=True).select_related('profile')
        if q:
            qs = qs.filter(
                Q(username__icontains=q) | Q(email__icontains=q) |
                Q(profile__primer_nombre__icontains=q) |
                Q(profile__primer_apellido__icontains=q)
            )
        return list(qs[:50])

    def validar_asignacion_posible(self, accion_id: str, usuario_id: int) -> None:
        from modulos.acciones.infraestructura.models import AccionModel
        from modulos.miembros.infraestructura.models import ProyectoMiembroModel
        from modulos.roles.infraestructura.models import UsuarioRolModel

        try:
            accion = AccionModel.objects.select_related('component').get(pk=accion_id)
        except AccionModel.DoesNotExist:
            raise ValueError("Acción no encontrada.")

        proyecto_id = accion.component.project_id
        if not ProyectoMiembroModel.objects.filter(
            proyecto_id=proyecto_id, usuario_id=usuario_id
        ).exists():
            raise ValueError("El usuario debe tener una membresía activa en el proyecto.")
        if not UsuarioRolModel.objects.filter(
            proyecto_id=proyecto_id, usuario_id=usuario_id, activo=True
        ).exists():
            raise ValueError("El usuario debe tener un rol activo en el proyecto.")
        if AsignacionResponsableAccionModel.objects.filter(
            accion_id=accion_id, usuario_id=usuario_id, activo=True
        ).exists():
            raise ValueError("El usuario ya está asignado activamente a esta acción.")

    def listar_acciones_para_usuario(self, usuario_id: int, es_superuser: bool,
                                     q: str = "", estado: str = "", proyecto_id: str = ""):
        from modulos.acciones.infraestructura.models import AccionModel
        from modulos.roles.infraestructura.models import UsuarioRolModel
        from django.db.models import Q, F

        if es_superuser:
            qs = AccionModel.objects.all()
        else:
            roles_gestor = [
                'superadministrador', 'administrador_proyecto',
                'coordinador_proyecto', 'coordinador_general',
            ]
            proyectos_gestor = UsuarioRolModel.objects.filter(
                usuario_id=usuario_id, rol__codigo__in=roles_gestor, activo=True
            ).values_list('proyecto_id', flat=True)
            comps_asignados = UsuarioRolModel.objects.filter(
                usuario_id=usuario_id, activo=True, componente_id__isnull=False
            ).values_list('componente_id', flat=True)
            acciones_por_rol = UsuarioRolModel.objects.filter(
                usuario_id=usuario_id, activo=True, accion_id__isnull=False
            ).values_list('accion_id', flat=True)
            acciones_por_asignacion = AsignacionResponsableAccionModel.objects.filter(
                usuario_id=usuario_id, activo=True
            ).values_list('accion_id', flat=True)
            qs = AccionModel.objects.filter(
                Q(component__project_id__in=proyectos_gestor) |
                Q(component_id__in=comps_asignados) |
                Q(id__in=acciones_por_rol) |
                Q(id__in=acciones_por_asignacion)
            )

        if proyecto_id:
            qs = qs.filter(component__project_id=proyecto_id)

        if q:
            qs = qs.filter(Q(name__icontains=q.strip()) | Q(description__icontains=q.strip()))

        if estado in ('completadas', 'completada'):
            qs = qs.filter(proyeccion_cuantitativa__gt=0,
                           ejecucion_acumulada__gte=F('proyeccion_cuantitativa'))
        elif estado in ('pendientes', 'pendiente'):
            qs = qs.filter(
                Q(proyeccion_cuantitativa__isnull=True) |
                Q(proyeccion_cuantitativa=0) |
                Q(ejecucion_acumulada__lt=F('proyeccion_cuantitativa'))
            )

        from django.db.models import Prefetch
        from modulos.acciones.infraestructura.models import RequisitoVerificacionAccionModel
        from modulos.uploads.infraestructura.models import UploadModel
        return qs.select_related(
            'component', 'component__project', 'component__meta'
        ).prefetch_related(
            Prefetch('requisitos', queryset=RequisitoVerificacionAccionModel.objects.filter(activo=True).order_by('orden')),
            Prefetch('uploads', queryset=UploadModel.objects.only('id', 'action_id', 'requisito_id', 'file_url', 'file_name', 'file_type', 'file_size', 'fecha_ejecucion', 'observaciones', 'created_at')),
        ).distinct()
