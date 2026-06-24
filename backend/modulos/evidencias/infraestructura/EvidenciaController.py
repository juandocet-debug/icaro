from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings
from .DjangoEvidenciaRepository import DjangoEvidenciaRepository
from modulos.evidencias.aplicacion.RegistrarEvidenciaUseCase import RegistrarEvidenciaUseCase
from modulos.evidencias.aplicacion.ListarEvidenciasUseCase import ListarEvidenciasUseCase
from modulos.proyectos.infraestructura.helpers import check_project_access
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase

def _serializar(e) -> dict:
    return {
        'id': str(e.id),
        'nombre': e.nombre,
        'url': e.url,
        'proyecto_id': str(e.proyecto_id),
        'created_at': str(e.created_at) if e.created_at else None
    }

class EvidenciaListCreateController(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

    def get(self, request, proyecto_id):
        try:
            check_project_access(proyecto_id, request.user)
            VerificarPermisoUseCase().ejecutar(request.user.id, 'evidencias.ver', proyecto_id=proyecto_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
            
        repo = DjangoEvidenciaRepository()
        use_case = ListarEvidenciasUseCase(repo)
        items = use_case.ejecutar(proyecto_id)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(items, request, view=self)
        if page is not None:
            datos = [_serializar(x) for x in page]
            return paginator.get_paginated_response(datos)
            
        return Response({'ok': True, 'datos': [_serializar(x) for x in items]}, status=200)

    def post(self, request, proyecto_id):
        try:
            check_project_access(proyecto_id, request.user)
            VerificarPermisoUseCase().ejecutar(request.user.id, 'evidencias.cargar', proyecto_id=proyecto_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
            
        repo = DjangoEvidenciaRepository()
        use_case = RegistrarEvidenciaUseCase(repo)
        try:
            e = use_case.ejecutar(
                nombre=request.data.get('nombre', ''),
                url=request.data.get('url', ''),
                proyecto_id=proyecto_id
            )
            return Response({'ok': True, 'datos': _serializar(e)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
