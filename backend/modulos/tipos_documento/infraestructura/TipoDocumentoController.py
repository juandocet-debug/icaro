from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.settings import api_settings
from .DjangoTipoDocumentoRepository import DjangoTipoDocumentoRepository
from ..aplicacion.CrearTipoDocumentoUseCase import CrearTipoDocumentoUseCase
from ..aplicacion.ListarTiposDocumentoUseCase import ListarTiposDocumentoUseCase
from ..aplicacion.EliminarTipoDocumentoUseCase import EliminarTipoDocumentoUseCase
from ..aplicacion.ActualizarTipoDocumentoUseCase import ActualizarTipoDocumentoUseCase

def _s(e):
    return {'id': e.id, 'nombre': e.nombre,
            'descripcion': e.descripcion, 'orden': e.orden}

class TipoDocumentoListCreateController(APIView):
    pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

    def get_permissions(self):
        # GET: cualquier autenticado | POST: solo admin
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

    def get(self, request, proyecto_id):
        from django.core.cache import cache
        cache_key = f'tipos_doc_{proyecto_id}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({'ok': True, 'datos': cached}, status=200)

        repo  = DjangoTipoDocumentoRepository()
        tipos = ListarTiposDocumentoUseCase(repo).ejecutar(proyecto_id)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(tipos, request, view=self)
        if page is not None:
            datos = [_s(t) for t in page]
            cache.set(cache_key, datos, timeout=600)  # 10 minutos
            return paginator.get_paginated_response(datos)
        datos = [_s(t) for t in tipos]
        cache.set(cache_key, datos, timeout=600)
        return Response({'ok': True, 'datos': datos}, status=200)

    def post(self, request, proyecto_id):
        repo = DjangoTipoDocumentoRepository()
        try:
            tipo = CrearTipoDocumentoUseCase(repo).ejecutar(
                proyecto_id=proyecto_id,
                nombre=request.data.get('nombre', ''),
                creado_por_id=request.user.id,
                descripcion=request.data.get('descripcion'),
                orden=request.data.get('orden', 0))
            from django.core.cache import cache
            cache.delete(f'tipos_doc_{proyecto_id}')
            return Response({'ok': True, 'datos': _s(tipo)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

class TipoDocumentoDetailController(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, proyecto_id, tipo_id):
        repo = DjangoTipoDocumentoRepository()
        try:
            tipo = ActualizarTipoDocumentoUseCase(repo).ejecutar(
                tipo_id=tipo_id,
                proyecto_id=proyecto_id,
                nombre=request.data.get('nombre', ''),
                descripcion=request.data.get('descripcion'),
            )
            return Response({'ok': True, 'datos': _s(tipo)}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

    def delete(self, request, proyecto_id, tipo_id):
        repo = DjangoTipoDocumentoRepository()
        ok = EliminarTipoDocumentoUseCase(repo).ejecutar(tipo_id, proyecto_id)
        if not ok:
            return Response({'ok': False,
                'error': 'Tipo de documento no encontrado.'}, status=404)
        return Response({'ok': True, 'mensaje': 'Eliminado correctamente.'}, status=200)
