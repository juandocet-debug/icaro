from django.contrib.auth import get_user_model
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel

User = get_user_model()


class VerificarPermisoUseCase:
    """
    Verifica si un usuario autenticado tiene permiso para ejecutar una acción.

    Política de alcances:
      - global    : cualquier acción sin necesidad de recurso específico.
      - proyecto  : solo si se provee proyecto_id y el usuario está asignado a él.
      - componente: solo si el componente pertenece al proyecto asignado.
      - accion    : solo si la acción pertenece al componente asignado.
      - publico   : NO otorga acceso a usuarios autenticados. Es exclusivo de
                    endpoints sin autenticación que NO usan este use case.

    Raises:
        PermissionError: si el usuario no tiene el permiso requerido en el alcance dado.
    """

    def ejecutar(
        self,
        usuario_id: int,
        codigo_permiso: str,
        proyecto_id: str = None,
        componente_id: str = None,
        accion_id: str = None,
    ) -> bool:
        try:
            usuario = User.objects.get(id=usuario_id)
        except User.DoesNotExist:
            raise PermissionError("Usuario no encontrado.")

        # 1. Superadministrador (is_staff o is_superuser): acceso total.
        if codigo_permiso.startswith('metas.'):
            if usuario.is_superuser:
                return True
        else:
            if usuario.is_staff or usuario.is_superuser:
                return True

        # 2. Validaciones de jerarquía cuando se pasan IDs de alcance.
        if componente_id and proyecto_id:
            try:
                comp = ComponenteModel.objects.get(id=componente_id)
                if str(comp.project_id) != str(proyecto_id):
                    raise PermissionError("El componente no pertenece al proyecto.")
            except ComponenteModel.DoesNotExist:
                raise PermissionError("Componente no encontrado.")

        if accion_id and componente_id:
            try:
                acc = AccionModel.objects.get(id=accion_id)
                if str(acc.component_id) != str(componente_id):
                    raise PermissionError("La acción no pertenece al componente.")
            except AccionModel.DoesNotExist:
                raise PermissionError("Acción no encontrada.")

        # 3. Buscar asignaciones activas que contengan el permiso solicitado.
        asignaciones = UsuarioRolModel.objects.filter(
            usuario=usuario,
            activo=True,
            rol__activo=True,
            rol__permisos_rel__permiso__codigo=codigo_permiso,
        ).select_related('rol')

        for asig in asignaciones:
            alcance = asig.rol.tipo_alcance

            if alcance == 'global':
                return True

            elif alcance == 'proyecto':
                if proyecto_id and str(asig.proyecto_id) == str(proyecto_id):
                    return True

            elif alcance == 'componente':
                if componente_id and str(asig.componente_id) == str(componente_id):
                    return True
                if not componente_id and proyecto_id and str(asig.proyecto_id) == str(proyecto_id):
                    return True

            elif alcance == 'accion':
                if accion_id and str(asig.accion_id) == str(accion_id):
                    return True
                if not accion_id and not componente_id and proyecto_id and str(asig.proyecto_id) == str(proyecto_id):
                    return True
                if not accion_id and componente_id and str(asig.componente_id) == str(componente_id):
                    return True

            # alcance == 'publico': NO concede acceso a usuarios autenticados.
            # Los endpoints verdaderamente públicos no invocan este use case.

        raise PermissionError(f"No tiene permisos para realizar esta acción ({codigo_permiso}).")
