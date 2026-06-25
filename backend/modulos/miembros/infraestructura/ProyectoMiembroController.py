from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ProyectoMiembroModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.roles.infraestructura.models import UsuarioRolModel
from .DjangoAsignacionMiembroRolRepository import DjangoAsignacionMiembroRolRepository
from ..aplicacion.AgregarRolAMiembroUseCase import AgregarRolAMiembroUseCase
from ..aplicacion.ActualizarAsignacionRolUseCase import ActualizarAsignacionRolUseCase
from ..aplicacion.RetirarRolDeMiembroUseCase import RetirarRolDeMiembroUseCase
from ..aplicacion.RetirarMiembroDelProyectoUseCase import RetirarMiembroDelProyectoUseCase

User = get_user_model()


def _build_roles_por_usuario(proyecto_id):
    """
    Carga TODOS los roles activos del proyecto en 1 sola query y devuelve
    un dict { usuario_id → [UsuarioRolModel, ...] } listo para _serialize_miembro.
    Elimina el patrón N+1: antes se lanzaba 1 query por miembro, ahora es 1 total.
    """
    roles_qs = (
        UsuarioRolModel.objects
        .filter(proyecto_id=proyecto_id, activo=True)
        .select_related('rol')
    )
    result = {}
    for ur in roles_qs:
        result.setdefault(ur.usuario_id, []).append(ur)
    return result


def _serialize_miembro(m, request=None, roles_por_usuario=None):
    """
    Serializa un miembro del proyecto.
    - Si `roles_por_usuario` está disponible, usa el dict precargado (0 queries extra).
    - Si no, hace la query puntual (solo para mutaciones individuales donde 1 query es aceptable).
    """
    usuario = m.usuario
    perfil = getattr(usuario, 'profile', None)
    nombre = f'{usuario.first_name} {usuario.last_name}'.strip() or usuario.username

    if roles_por_usuario is not None:
        user_roles = roles_por_usuario.get(usuario.id, [])
    else:
        user_roles = list(
            UsuarioRolModel.objects
            .filter(usuario=usuario, proyecto_id=m.proyecto_id, activo=True)
            .select_related('rol')
        )

    roles_list = [
        {
            'id': str(ur.id),
            'rol_id': str(ur.rol.id),
            'rol_nombre': ur.rol.nombre,
            'componente_id': str(ur.componente_id) if ur.componente_id else None,
            'accion_id': str(ur.accion_id) if ur.accion_id else None,
        }
        for ur in user_roles
    ]

    first_rol = user_roles[0] if user_roles else None

    foto_url = None
    if perfil and perfil.photo:
        try:
            foto_url = request.build_absolute_uri(perfil.photo.url) if request else perfil.photo.url
        except Exception:
            foto_url = None

    return {
        'id': str(m.id),
        'usuario_id': usuario.id,
        'username': usuario.username,
        'email': usuario.email,
        'nombre_completo': nombre,
        'cargo': perfil.cargo if perfil else None,
        'rol_id': str(first_rol.rol.id) if first_rol else None,
        'rol_nombre': first_rol.rol.nombre if first_rol else 'Sin Rol',
        'proyecto_id': str(first_rol.proyecto_id) if first_rol and first_rol.proyecto_id else None,
        'componente_id': str(first_rol.componente_id) if first_rol and first_rol.componente_id else None,
        'accion_id': str(first_rol.accion_id) if first_rol and first_rol.accion_id else None,
        'foto_url': foto_url,
        'roles': roles_list,
    }


class ProyectoMiembroListCreateController(APIView):
    def get_permissions(self):
        return [IsAuthenticated()]

    def get(self, request, proyecto_id):
        if not ProyectoModel.objects.filter(id=proyecto_id).exists():
            return Response({'ok': False, 'error': 'Proyecto no encontrado.'}, status=404)

        from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'miembros.ver', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # 2 queries totales: 1 miembros + 1 todos los roles del proyecto (sin N+1)
        miembros = (
            ProyectoMiembroModel.objects
            .filter(proyecto_id=proyecto_id)
            .select_related('usuario', 'usuario__profile')
        )
        roles_por_usuario = _build_roles_por_usuario(proyecto_id)

        return Response(
            {'ok': True, 'datos': [_serialize_miembro(m, request, roles_por_usuario) for m in miembros]},
            status=200,
        )

    def post(self, request, proyecto_id):
        if not ProyectoModel.objects.filter(id=proyecto_id).exists():
            return Response({'ok': False, 'error': 'Proyecto no encontrado.'}, status=404)

        from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'miembros.asignar', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        username = request.data.get('username', '').strip()
        rol_id = request.data.get('rol_id')
        componente_id = request.data.get('componente_id')
        accion_id = request.data.get('accion_id')

        if not username:
            return Response({'ok': False, 'error': 'El username es obligatorio.'}, status=400)
        if not rol_id:
            return Response({'ok': False, 'error': 'El rol es obligatorio.'}, status=400)

        try:
            usuario = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'ok': False, 'error': f'No existe el usuario "{username}".'}, status=404)

        repo = DjangoAsignacionMiembroRolRepository()
        use_case = AgregarRolAMiembroUseCase(repo)
        try:
            m = use_case.ejecutar(
                proyecto_id=proyecto_id,
                usuario_id=usuario.id,
                rol_id=rol_id,
                componente_id=componente_id,
                accion_id=accion_id,
                agregado_por_id=request.user.id,
            )
            m.refresh_from_db()
            m.usuario = User.objects.select_related('profile').get(pk=m.usuario_id)
            return Response({'ok': True, 'datos': _serialize_miembro(m, request)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)


class ProyectoMiembroDetailController(APIView):
    def get_permissions(self):
        return [IsAuthenticated()]

    def delete(self, request, proyecto_id, miembro_id):
        if not ProyectoModel.objects.filter(id=proyecto_id).exists():
            return Response({'ok': False, 'error': 'Proyecto no encontrado.'}, status=404)

        from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'miembros.retirar', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoAsignacionMiembroRolRepository()
        use_case = RetirarMiembroDelProyectoUseCase(repo)
        try:
            use_case.ejecutar(proyecto_id=proyecto_id, miembro_id=miembro_id)
            return Response({'ok': True, 'mensaje': 'Miembro eliminado.'}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)


class ProyectoMiembroRolDetailController(APIView):
    def get_permissions(self):
        return [IsAuthenticated()]

    def patch(self, request, proyecto_id, asignacion_id):
        if not ProyectoModel.objects.filter(id=proyecto_id).exists():
            return Response({'ok': False, 'error': 'Proyecto no encontrado.'}, status=404)

        from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'miembros.actualizar', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        rol_id = request.data.get('rol_id')
        componente_id = request.data.get('componente_id')
        accion_id = request.data.get('accion_id')

        if not rol_id:
            return Response({'ok': False, 'error': 'El rol es obligatorio.'}, status=400)

        repo = DjangoAsignacionMiembroRolRepository()
        use_case = ActualizarAsignacionRolUseCase(repo)
        try:
            m = use_case.ejecutar(
                proyecto_id=proyecto_id,
                asignacion_id=asignacion_id,
                rol_id=rol_id,
                componente_id=componente_id,
                accion_id=accion_id,
            )
            m.refresh_from_db()
            m.usuario = User.objects.select_related('profile').get(pk=m.usuario_id)
            return Response({'ok': True, 'datos': _serialize_miembro(m, request)}, status=200)
        except ValueError as e:
            status_code = 404 if 'no encontrada' in str(e) or 'no encontrado' in str(e) else 400
            return Response({'ok': False, 'error': str(e)}, status=status_code)

    def delete(self, request, proyecto_id, asignacion_id):
        if not ProyectoModel.objects.filter(id=proyecto_id).exists():
            return Response({'ok': False, 'error': 'Proyecto no encontrado.'}, status=404)

        from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'miembros.retirar', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoAsignacionMiembroRolRepository()
        use_case = RetirarRolDeMiembroUseCase(repo)
        try:
            use_case.ejecutar(proyecto_id=proyecto_id, asignacion_id=asignacion_id)
            return Response({'ok': True, 'mensaje': 'Rol retirado.'}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
