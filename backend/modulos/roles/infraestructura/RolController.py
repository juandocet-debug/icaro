from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .DjangoRolRepository import DjangoRolRepository
from ..aplicacion.ListarRolesUseCase import ListarRolesUseCase
from ..aplicacion.CrearRolUseCase import CrearRolUseCase
from ..aplicacion.ActualizarRolUseCase import ActualizarRolUseCase
from ..aplicacion.EliminarRolUseCase import EliminarRolUseCase
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase

def _serialize_rol(rol):
    return {
        'id': rol.id,
        'codigo': rol.codigo,
        'nombre': rol.nombre,
        'descripcion': rol.descripcion,
        'es_sistema': rol.es_sistema,
        'activo': rol.activo,
        'permisos': rol.permisos,
        'cantidad_usuarios': rol.cantidad_usuarios,
        'tipo_alcance': rol.tipo_alcance
    }

class RolListCreateController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'roles.ver')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        from django.core.cache import cache
        activo_param = request.query_params.get('activo', '')
        cache_key = f'roles_list_{activo_param}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({'ok': True, 'datos': cached}, status=200)

        repo = DjangoRolRepository()
        roles = ListarRolesUseCase(repo).ejecutar()
        if activo_param:
            es_activo = activo_param.lower() == 'true'
            roles = [r for r in roles if r.activo == es_activo]
        datos = [_serialize_rol(r) for r in roles]
        cache.set(cache_key, datos, timeout=300)  # 5 minutos
        return Response({'ok': True, 'datos': datos}, status=200)

    def post(self, request):
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'roles.crear')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        proyecto_id = request.data.get('proyecto')
        componente_id = request.data.get('componente')
        accion_id = request.data.get('accion')
        
        if componente_id and proyecto_id:
            try:
                comp = ComponenteModel.objects.get(id=componente_id)
                if str(comp.project_id) != str(proyecto_id):
                    return Response({'ok': False, 'error': 'El componente no pertenece al proyecto especificado.'}, status=400)
            except ComponenteModel.DoesNotExist:
                return Response({'ok': False, 'error': 'Componente no encontrado.'}, status=400)
        
        if accion_id and componente_id:
            try:
                acc = AccionModel.objects.get(id=accion_id)
                if str(acc.component_id) != str(componente_id):
                    return Response({'ok': False, 'error': 'La acción no pertenece al componente especificado.'}, status=400)
            except AccionModel.DoesNotExist:
                return Response({'ok': False, 'error': 'Acción no encontrada.'}, status=400)

        repo = DjangoRolRepository()
        nombre = request.data.get('nombre', '')
        descripcion = request.data.get('descripcion', '')
        permisos = request.data.get('permisos', [])
        try:
            rol = CrearRolUseCase(repo).ejecutar(nombre, descripcion, permisos)
            from django.core.cache import cache
            cache.delete_many(['roles_list_', 'roles_list_true', 'roles_list_false'])
            return Response({'ok': True, 'datos': _serialize_rol(rol)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

class RolDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'roles.ver')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoRolRepository()
        rol = repo.obtener_rol_por_id(pk)
        if not rol:
            return Response({'ok': False, 'error': 'Rol no encontrado.'}, status=404)
        return Response({'ok': True, 'datos': _serialize_rol(rol)}, status=200)

    def patch(self, request, pk):
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'roles.editar')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoRolRepository()
        nombre = request.data.get('nombre')
        descripcion = request.data.get('descripcion')
        permisos = request.data.get('permisos')
        
        rol = repo.obtener_rol_por_id(pk)
        if not rol:
            return Response({'ok': False, 'error': 'Rol no encontrado.'}, status=404)
            
        nombre = nombre if nombre is not None else rol.nombre
        descripcion = descripcion if descripcion is not None else rol.descripcion
        permisos = permisos if permisos is not None else rol.permisos

        try:
            rol = ActualizarRolUseCase(repo).ejecutar(pk, nombre, descripcion, permisos)
            return Response({'ok': True, 'datos': _serialize_rol(rol)}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

    def delete(self, request, pk):
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'roles.desactivar')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoRolRepository()
        try:
            EliminarRolUseCase(repo).ejecutar(pk)
            return Response({'ok': True, 'mensaje': 'Rol eliminado o desactivado con éxito.'}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

class PermisosListController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'roles.ver')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoRolRepository()
        permisos = repo.listar_permisos()
        data = [{
            'codigo': p.codigo,
            'nombre': p.nombre,
            'modulo': p.modulo,
            'descripcion': p.descripcion
        } for p in permisos]
        return Response({'ok': True, 'datos': data}, status=200)
