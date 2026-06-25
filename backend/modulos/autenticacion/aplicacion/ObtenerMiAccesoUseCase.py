from django.contrib.auth import get_user_model
from modulos.roles.infraestructura.models import UsuarioRolModel, PermisoModel, RolPermisoModel

User = get_user_model()


class ObtenerMiAccesoUseCase:
    """
    Devuelve el perfil de acceso efectivo del usuario:

    - es_superadministrador: True si is_staff o is_superuser.
    - permisos: lista de {codigo, alcance} donde alcance indica si el permiso
      aplica de forma 'global' o restringida al proyecto/componente/accion.
    - asignaciones: lista de roles activos con su scope.

    El frontend NO debe tratar un permiso con alcance='proyecto' como un permiso
    global de interfaz; debe verificar que el proyecto actual coincide con el
    proyecto de la asignación antes de mostrar vistas operativas.
    """

    def ejecutar(self, user_id: int):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValueError("Usuario no encontrado.")

        # SECURITY: solo is_superuser es superadministrador de la aplicación.
        # is_staff únicamente da acceso al panel admin de Django, no a privilegios globales de Ícaro.
        es_super = bool(user.is_superuser)

        if es_super:
            permisos = [
                {'codigo': codigo, 'alcance': 'global'}
                for codigo in PermisoModel.objects.values_list('codigo', flat=True)
            ]
            asignaciones = []
        else:
            roles_qs = (
                UsuarioRolModel.objects
                .filter(usuario=user, activo=True)
                .select_related('rol', 'proyecto', 'componente', 'accion')
            )

            asignaciones = []
            # Mapa permiso_codigo -> alcance más amplio que tiene el usuario
            # Prioridad: global > proyecto > componente > accion
            PRIORIDAD = {'global': 0, 'proyecto': 1, 'componente': 2, 'accion': 3}
            permisos_mapa: dict[str, str] = {}

            for ur in roles_qs:
                tipo_alcance = ur.rol.tipo_alcance

                # No incluir roles públicos en el perfil de acceso autenticado
                if tipo_alcance == 'publico':
                    continue

                asignaciones.append({
                    'rol_codigo': ur.rol.codigo,
                    'rol_nombre': ur.rol.nombre,
                    'tipo_alcance': tipo_alcance,
                    'proyecto_id': str(ur.proyecto.id) if ur.proyecto else None,
                    'proyecto_nombre': ur.proyecto.name if ur.proyecto else None,
                    'componente_id': str(ur.componente.id) if ur.componente else None,
                    'accion_id': str(ur.accion.id) if ur.accion else None,
                })

                codigos = RolPermisoModel.objects.filter(rol=ur.rol).values_list('permiso_id', flat=True)
                for codigo in codigos:
                    prioridad_nueva = PRIORIDAD.get(tipo_alcance, 99)
                    prioridad_actual = PRIORIDAD.get(permisos_mapa.get(codigo, 'accion'), 99)
                    if prioridad_nueva <= prioridad_actual:
                        permisos_mapa[codigo] = tipo_alcance

            permisos = [
                {'codigo': codigo, 'alcance': alcance}
                for codigo, alcance in permisos_mapa.items()
            ]

        return {
            'es_superadministrador': es_super,
            'permisos': permisos,
            'asignaciones': asignaciones,
        }
