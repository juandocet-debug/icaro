from django.db import transaction

from modulos.acciones.infraestructura.models import AccionModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.miembros.dominio.AsignacionMiembroRolRepositoryPort import AsignacionMiembroRolRepositoryPort
from modulos.miembros.infraestructura.models import ProyectoMiembroModel
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel


class DjangoAsignacionMiembroRolRepository(AsignacionMiembroRolRepositoryPort):
    @staticmethod
    def _obtener_rol_asignable(rol_id: str) -> RolModel:
        try:
            rol = RolModel.objects.get(id=rol_id)
        except RolModel.DoesNotExist as exc:
            raise ValueError('El rol especificado no existe.') from exc

        if not rol.activo:
            raise ValueError('El rol no está activo.')
        if rol.tipo_alcance == 'global' or rol.codigo == 'superadministrador':
            raise ValueError('No se puede asignar un rol global desde un proyecto.')
        if rol.codigo == 'consulta_publica':
            raise ValueError('El rol de consulta pública no puede ser asignado a usuarios.')
        return rol

    @staticmethod
    def _validar_alcance(proyecto_id: str, rol: RolModel, componente_id: str = None, accion_id: str = None):
        if rol.tipo_alcance == 'componente' and not componente_id:
            raise ValueError('Rol de alcance componente exige componente válido.')
        if rol.tipo_alcance == 'accion' and (not componente_id or not accion_id):
            raise ValueError('Rol de alcance acción exige componente y acción válidos.')

        if componente_id:
            try:
                componente = ComponenteModel.objects.get(id=componente_id)
            except ComponenteModel.DoesNotExist as exc:
                raise ValueError('Componente no encontrado.') from exc
            if str(componente.project_id) != str(proyecto_id):
                raise ValueError('El componente no pertenece al proyecto especificado.')

        if accion_id:
            try:
                accion = AccionModel.objects.get(id=accion_id)
            except AccionModel.DoesNotExist as exc:
                raise ValueError('Acción no encontrada.') from exc
            if str(accion.component_id) != str(componente_id):
                raise ValueError('La acción no pertenece al componente especificado.')

        return (
            componente_id if rol.tipo_alcance in ('componente', 'accion') else None,
            accion_id if rol.tipo_alcance == 'accion' else None,
        )

    def agregar_rol_a_miembro(
        self,
        proyecto_id: str,
        usuario_id: int,
        rol_id: str,
        componente_id: str = None,
        accion_id: str = None,
        agregado_por_id: int = None,
    ):
        with transaction.atomic():
            rol = self._obtener_rol_asignable(rol_id)
            componente_id, accion_id = self._validar_alcance(
                proyecto_id, rol, componente_id, accion_id
            )
            miembro, _ = ProyectoMiembroModel.objects.get_or_create(
                proyecto_id=proyecto_id,
                usuario_id=usuario_id,
                defaults={'agregado_por_id': agregado_por_id},
            )
            asignacion, creada = UsuarioRolModel.objects.get_or_create(
                usuario_id=usuario_id,
                proyecto_id=proyecto_id,
                rol=rol,
                componente_id=componente_id,
                accion_id=accion_id,
                defaults={'activo': True},
            )
            if not creada:
                if asignacion.activo:
                    raise ValueError('Esta asignación de rol ya existe y está activa.')
                asignacion.activo = True
                asignacion.save(update_fields=['activo', 'updated_at'])
            return miembro

    def actualizar_asignacion_rol(
        self,
        proyecto_id: str,
        asignacion_id: str,
        rol_id: str,
        componente_id: str = None,
        accion_id: str = None,
    ):
        with transaction.atomic():
            try:
                asignacion = UsuarioRolModel.objects.select_for_update().get(
                    id=asignacion_id, proyecto_id=proyecto_id, activo=True
                )
            except UsuarioRolModel.DoesNotExist as exc:
                raise ValueError('Asignación de rol no encontrada.') from exc

            rol = self._obtener_rol_asignable(rol_id)
            componente_id, accion_id = self._validar_alcance(
                proyecto_id, rol, componente_id, accion_id
            )
            duplicate_exists = UsuarioRolModel.objects.filter(
                usuario_id=asignacion.usuario_id,
                proyecto_id=proyecto_id,
                rol=rol,
                componente_id=componente_id,
                accion_id=accion_id,
                activo=True,
            ).exclude(id=asignacion.id).exists()
            if duplicate_exists:
                raise ValueError('Esta asignación de rol ya existe y está activa.')

            asignacion.rol = rol
            asignacion.componente_id = componente_id
            asignacion.accion_id = accion_id
            asignacion.save(update_fields=['rol', 'componente', 'accion', 'updated_at'])
            return ProyectoMiembroModel.objects.get(
                proyecto_id=proyecto_id, usuario_id=asignacion.usuario_id
            )

    def retirar_rol_de_miembro(self, proyecto_id: str, asignacion_id: str):
        with transaction.atomic():
            try:
                asignacion = UsuarioRolModel.objects.select_for_update().get(
                    id=asignacion_id, proyecto_id=proyecto_id, activo=True
                )
            except UsuarioRolModel.DoesNotExist as exc:
                raise ValueError('Asignación de rol no encontrada.') from exc

            usuario_id = asignacion.usuario_id
            asignacion.delete()
            if not UsuarioRolModel.objects.filter(
                usuario_id=usuario_id, proyecto_id=proyecto_id, activo=True
            ).exists():
                ProyectoMiembroModel.objects.filter(
                    proyecto_id=proyecto_id, usuario_id=usuario_id
                ).delete()
                from modulos.acciones.infraestructura.models import AsignacionResponsableAccionModel
                AsignacionResponsableAccionModel.objects.filter(
                    usuario_id=usuario_id,
                    accion__component__project_id=proyecto_id,
                    activo=True
                ).update(activo=False)

    def retirar_miembro_del_proyecto(self, proyecto_id: str, miembro_id: str):
        with transaction.atomic():
            try:
                miembro = ProyectoMiembroModel.objects.select_for_update().get(
                    id=miembro_id, proyecto_id=proyecto_id
                )
            except ProyectoMiembroModel.DoesNotExist as exc:
                raise ValueError('Miembro no encontrado.') from exc

            UsuarioRolModel.objects.filter(
                usuario_id=miembro.usuario_id, proyecto_id=proyecto_id
            ).delete()
            from modulos.acciones.infraestructura.models import AsignacionResponsableAccionModel
            AsignacionResponsableAccionModel.objects.filter(
                usuario_id=miembro.usuario_id,
                accion__component__project_id=proyecto_id,
                activo=True
            ).update(activo=False)
            miembro.delete()

    def existe_miembro(self, proyecto_id: str, usuario_id: int) -> bool:
        return ProyectoMiembroModel.objects.filter(
            proyecto_id=proyecto_id, usuario_id=usuario_id
        ).exists()
