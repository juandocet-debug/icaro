from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from modulos.autenticacion.aplicacion.CrearUsuarioUseCase import CrearUsuarioUseCase
from modulos.autenticacion.aplicacion.ActualizarDatosUsuarioUseCase import ActualizarDatosUsuarioUseCase
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from modulos.autenticacion.infraestructura.DjangoUsuarioRepository import DjangoUsuarioRepository
from modulos.autenticacion.aplicacion.ActualizarUsuarioUseCase import ActualizarUsuarioUseCase
from modulos.autenticacion.aplicacion.EliminarUsuarioUseCase import EliminarUsuarioUseCase

User = get_user_model()

def _s(u, request=None):
    perfil = getattr(u, 'profile', None)
    # Usar el valor anotado cuando viene del queryset optimizado; fallback para otros usos
    asignaciones_count = getattr(u, 'asignaciones_count', None)
    if asignaciones_count is None:
        from modulos.roles.infraestructura.models import UsuarioRolModel
        asignaciones_count = UsuarioRolModel.objects.filter(usuario=u, activo=True).values('proyecto_id').distinct().count()

    primer_nombre = perfil.primer_nombre if perfil else ""
    segundo_nombre = perfil.segundo_nombre if perfil else ""
    primer_apellido = perfil.primer_apellido if perfil else ""
    segundo_apellido = perfil.segundo_apellido if perfil else ""

    partes = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
    nombre_completo = " ".join([p.strip() for p in partes if p and p.strip()]).strip()
    if not nombre_completo:
        nombre_completo = u.username

    # foto_url: URL absoluta pública si existe; null si no hay foto.
    # Nunca devuelve rutas de disco, hashes ni metadatos internos.
    foto_url = None
    if perfil and perfil.photo:
        try:
            foto_url = request.build_absolute_uri(perfil.photo.url) if request else perfil.photo.url
        except Exception:
            foto_url = None

    return {
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'nombre_completo': nombre_completo,
        'primer_nombre': primer_nombre,
        'segundo_nombre': segundo_nombre or "",
        'primer_apellido': primer_apellido,
        'segundo_apellido': segundo_apellido or "",
        'telefono': perfil.telefono if perfil else "",
        'is_active': u.is_active,
        'is_staff': u.is_staff,
        'asignaciones_count': asignaciones_count,
        'foto_url': foto_url,
    }


class UsuariosListController(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = __import__('rest_framework.settings', fromlist=['api_settings']).api_settings.DEFAULT_PAGINATION_CLASS

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            try:
                VerificarPermisoUseCase().ejecutar(request.user.id, 'usuarios.ver')
            except PermissionError as e:
                return Response({'ok': False, 'error': str(e)}, status=403)

        from django.db.models import Q, Count

        q = request.query_params.get('q', '').strip()
        # annotate resuelve el N+1: un solo JOIN calcula asignaciones_count para todos los usuarios
        qs = User.objects.select_related('profile').annotate(
            asignaciones_count=Count(
                'usuario_roles__proyecto_id',
                filter=Q(usuario_roles__activo=True),
                distinct=True,
            )
        ).order_by('username')

        if q:
            qs = qs.filter(
                Q(username__icontains=q) | Q(email__icontains=q) |
                Q(profile__primer_nombre__icontains=q) | Q(profile__primer_apellido__icontains=q)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            return paginator.get_paginated_response([_s(u, request) for u in page])
        return Response({'ok': True, 'datos': [_s(u, request) for u in qs]}, status=200)

    def post(self, request):
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'usuarios.crear')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        cedula = request.data.get('cedula', '').strip()
        primer_nombre = request.data.get('primer_nombre', '').strip()
        segundo_nombre = request.data.get('segundo_nombre', '').strip()
        primer_apellido = request.data.get('primer_apellido', '').strip()
        segundo_apellido = request.data.get('segundo_apellido', '').strip()
        email = request.data.get('email', '').strip()
        telefono = request.data.get('telefono', '').strip()

        use_case = CrearUsuarioUseCase()
        try:
            u = use_case.ejecutar(
                cedula=cedula,
                primer_nombre=primer_nombre,
                segundo_nombre=segundo_nombre,
                primer_apellido=primer_apellido,
                segundo_apellido=segundo_apellido,
                email=email,
                telefono=telefono
            )
            return Response({'ok': True, 'datos': _s(u, request)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

class UsuarioDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if 'is_active' in request.data:
            # usuarios.desactivar: aceptar cualquier alcance (global o proyecto)
            from modulos.roles.infraestructura.models import UsuarioRolModel
            puede = (
                request.user.is_superuser or request.user.is_staff or
                UsuarioRolModel.objects.filter(
                    usuario=request.user,
                    activo=True,
                    rol__activo=True,
                    rol__permisos_rel__permiso__codigo='usuarios.desactivar',
                ).exists()
            )
            if not puede:
                return Response({'ok': False, 'error': 'No tiene permiso para activar/desactivar usuarios.'}, status=403)

            # Guardia: solo superadmin puede desactivar a otro superadmin
            try:
                objetivo = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return Response({'ok': False, 'error': 'Usuario no encontrado.'}, status=404)
            if objetivo.is_superuser and not request.user.is_superuser:
                return Response({'ok': False, 'error': 'No puede desactivar a un superadministrador.'}, status=403)
        else:
            try:
                VerificarPermisoUseCase().ejecutar(request.user.id, 'usuarios.editar')
            except PermissionError as e:
                return Response({'ok': False, 'error': str(e)}, status=403)

        primer_nombre = request.data.get('primer_nombre')
        segundo_nombre = request.data.get('segundo_nombre')
        primer_apellido = request.data.get('primer_apellido')
        segundo_apellido = request.data.get('segundo_apellido')
        email = request.data.get('email')
        telefono = request.data.get('telefono')
        is_active = request.data.get('is_active')
        password = request.data.get('password')

        use_case = ActualizarDatosUsuarioUseCase()
        try:
            u = use_case.ejecutar(
                user_id=user_id,
                primer_nombre=primer_nombre,
                segundo_nombre=segundo_nombre,
                primer_apellido=primer_apellido,
                segundo_apellido=segundo_apellido,
                email=email,
                telefono=telefono,
                is_active=is_active,
                password=password
            )
            return Response({'ok': True, 'datos': _s(u, request)}, status=200)
        except ValueError as e:
            status_code = 404 if "Usuario no encontrado" in str(e) else 400
            return Response({'ok': False, 'error': str(e)}, status=status_code)

    def put(self, request, user_id):
        if not request.user.is_superuser:
            return Response({'ok': False, 'error': 'No tienes permisos para realizar esta acción.'}, status=403)

        repo = DjangoUsuarioRepository()
        use_case = ActualizarUsuarioUseCase(repo)
        try:
            u = use_case.ejecutar(
                superadmin_id=request.user.id,
                user_id=user_id,
                datos=request.data
            )
            return Response({'ok': True, 'datos': _s(u, request)}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

    def delete(self, request, user_id):
        if not request.user.is_superuser:
            return Response({'ok': False, 'error': 'No tienes permisos para realizar esta acción.'}, status=403)

        repo = DjangoUsuarioRepository()
        use_case = EliminarUsuarioUseCase(repo)
        try:
            use_case.ejecutar(
                superadmin_id=request.user.id,
                user_id=user_id
            )
            return Response({'ok': True, 'mensaje': 'Usuario eliminado.'}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

class UsuarioAsignacionesController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'ok': False, 'error': 'Acceso no autorizado.'}, status=403)

        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'ok': False, 'error': 'Usuario no encontrado.'}, status=404)

        from modulos.roles.infraestructura.models import UsuarioRolModel
        roles_qs = UsuarioRolModel.objects.filter(usuario=u).select_related('rol', 'proyecto', 'componente', 'accion')
        
        datos = []
        for ur in roles_qs:
            datos.append({
                'proyecto_id': str(ur.proyecto.id) if ur.proyecto else None,
                'proyecto_nombre': ur.proyecto.name if ur.proyecto else None,
                'rol_codigo': ur.rol.codigo,
                'rol_nombre': ur.rol.nombre,
                'componente_id': str(ur.componente.id) if ur.componente else None,
                'accion_id': str(ur.accion.id) if ur.accion else None,
                'activo': ur.activo
            })
            
        return Response({'ok': True, 'datos': datos}, status=200)
