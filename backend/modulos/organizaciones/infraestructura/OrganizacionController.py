from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings
from .DjangoOrganizacionRepository import DjangoOrganizacionRepository
from modulos.organizaciones.aplicacion.CrearOrganizacionUseCase import CrearOrganizacionUseCase
from modulos.organizaciones.aplicacion.ListarOrganizacionesUseCase import ListarOrganizacionesUseCase
from .models import OrganizacionModel


def _serializar(org) -> dict:
    return {
        'id': str(org.id),
        'nombre': org.nombre,
        'sigla': org.sigla,
        'nit': org.nit,
        'activo': org.activo,
    }


class OrganizacionListCreateController(APIView):
    """GET /api/organizaciones/  POST /api/organizaciones/"""
    permission_classes = [IsAuthenticated]
    pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

    def get(self, request):
        repo = DjangoOrganizacionRepository()
        caso_uso = ListarOrganizacionesUseCase(repo)
        orgs = caso_uso.ejecutar(solo_activas=True)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(orgs, request, view=self)
        if page is not None:
            datos = [_serializar(o) for o in page]
            return paginator.get_paginated_response(datos)
            
        return Response({'ok': True, 'datos': [_serializar(o) for o in orgs]}, status=200)

    def post(self, request):
        repo = DjangoOrganizacionRepository()
        caso_uso = CrearOrganizacionUseCase(repo)
        try:
            org = caso_uso.ejecutar(
                nombre=request.data.get('nombre', ''),
                sigla=request.data.get('sigla'),
                nit=request.data.get('nit'),
            )
            return Response({'ok': True, 'datos': _serializar(org)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)


class OrganizacionDetailController(APIView):
    """GET /api/organizaciones/<id>/  PUT /api/organizaciones/<id>/  DELETE /api/organizaciones/<id>/"""
    permission_classes = [IsAuthenticated]

    def _get_repo(self):
        return DjangoOrganizacionRepository()

    def get(self, request, org_id):
        repo = self._get_repo()
        org = repo.obtener_por_id(org_id)
        if not org:
            return Response({'ok': False, 'error': 'Organización no encontrada.'}, status=404)
        return Response({'ok': True, 'datos': _serializar(org)}, status=200)

    def put(self, request, org_id):
        repo = self._get_repo()
        org = repo.obtener_por_id(org_id)
        if not org:
            return Response({'ok': False, 'error': 'Organización no encontrada.'}, status=404)
        org.nombre = request.data.get('nombre', org.nombre)
        org.sigla = request.data.get('sigla', org.sigla)
        org.nit = request.data.get('nit', org.nit)
        actualizado = repo.actualizar(org)
        return Response({'ok': True, 'datos': _serializar(actualizado)}, status=200)

    def delete(self, request, org_id):
        repo = self._get_repo()
        eliminado = repo.eliminar(org_id)
        if not eliminado:
            return Response({'ok': False, 'error': 'Organización no encontrada.'}, status=404)
        return Response({'ok': True, 'mensaje': 'Organización desactivada.'}, status=200)
