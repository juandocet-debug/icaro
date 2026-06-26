from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .DjangoComponenteRepository import DjangoComponenteRepository
from modulos.componentes.aplicacion.CrearComponenteUseCase import CrearComponenteUseCase
from modulos.componentes.aplicacion.ListarComponentesUseCase import ListarComponentesUseCase
from modulos.componentes.aplicacion.ObtenerComponenteUseCase import ObtenerComponenteUseCase
from modulos.componentes.aplicacion.ActualizarComponenteUseCase import ActualizarComponenteUseCase
from modulos.componentes.aplicacion.EliminarComponenteUseCase import EliminarComponenteUseCase
from modulos.proyectos.infraestructura.helpers import check_project_access, check_component_access
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase

def _s(c):
    from modulos.acciones.infraestructura.models import AccionModel
    has_groups = AccionModel.objects.filter(component_id=c.id, requiere_grupos=True).exists()
    return {
        'id': str(c.id),
        'proyecto_id': str(c.proyecto_id),
        'meta_id': str(c.meta_id),
        'name': c.name,
        'description': c.description,
        'display_order': c.display_order,
        'con_grupos': has_groups
    }

class ComponenteListCreateController(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, proyecto_id):
        try:
            check_project_access(proyecto_id, request.user)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)

        meta_id = request.query_params.get('meta_id')
        con_grupos = request.query_params.get('con_grupos')
        repo = DjangoComponenteRepository()
        componentes = ListarComponentesUseCase(repo).ejecutar(proyecto_id)
        if meta_id:
            componentes = [c for c in componentes if str(c.meta_id) == meta_id]
        if con_grupos is not None:
            from modulos.acciones.infraestructura.models import AccionModel
            comp_ids_with_groups = AccionModel.objects.filter(
                component__project_id=proyecto_id,
                requiere_grupos=True
            ).values_list('component_id', flat=True).distinct()
            comp_ids_with_groups = [str(x) for x in comp_ids_with_groups]
            if con_grupos.lower() in ('true', '1'):
                componentes = [c for c in componentes if str(c.id) in comp_ids_with_groups]
            else:
                componentes = [c for c in componentes if str(c.id) not in comp_ids_with_groups]
        return Response({'ok':True,'datos':[_s(c) for c in componentes]},status=200)
    def post(self, request, proyecto_id):
        try:
            check_project_access(proyecto_id, request.user)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'componentes.crear', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)

        meta_id = request.data.get('meta_id')
        repo = DjangoComponenteRepository()
        try:
            c = CrearComponenteUseCase(repo).ejecutar(
                proyecto_id=proyecto_id, meta_id=meta_id, name=request.data.get('name',''),
                description=request.data.get('description'))
            return Response({'ok':True,'datos':_s(c)},status=201)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=400)

class ComponenteDetailController(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, proyecto_id, comp_id):
        try:
            check_component_access(comp_id, proyecto_id, request.user)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)
            
        repo = DjangoComponenteRepository()
        c = ObtenerComponenteUseCase(repo).ejecutar(comp_id)
        if not c: return Response({'ok':False,'error':'Componente no encontrado.'},status=404)
        return Response({'ok':True,'datos':_s(c)},status=200)
    def put(self, request, proyecto_id, comp_id):
        try:
            check_component_access(comp_id, proyecto_id, request.user)
            VerificarPermisoUseCase().ejecutar(request.user.id, 'componentes.editar', proyecto_id=proyecto_id)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)
            
        repo = DjangoComponenteRepository()
        try:
            c = ActualizarComponenteUseCase(repo).ejecutar(comp_id, **request.data)
            return Response({'ok':True,'datos':_s(c)},status=200)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=400)
    def delete(self, request, proyecto_id, comp_id):
        try:
            check_component_access(comp_id, proyecto_id, request.user)
            VerificarPermisoUseCase().ejecutar(request.user.id, 'componentes.eliminar', proyecto_id=proyecto_id)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)
            
        from modulos.acciones.infraestructura.models import AccionModel
        force_query = request.query_params.get('force', 'false').lower() == 'true'
        force_body = isinstance(request.data, dict) and request.data.get('force', False)
        force = force_query or force_body

        if AccionModel.objects.filter(component_id=comp_id).exists():
            if not (request.user.is_superuser and force):
                return Response({
                    'ok': False,
                    'error': 'No se puede eliminar el componente porque tiene acciones activas.'
                }, status=409)

        repo = DjangoComponenteRepository()
        ok = EliminarComponenteUseCase(repo).ejecutar(comp_id)
        if not ok: return Response({'ok':False,'error':'Componente no encontrado.'},status=404)
        return Response({'ok':True,'mensaje':'Componente eliminado.'},status=200)
