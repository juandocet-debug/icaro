from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings
from .DjangoNotificacionRepository import DjangoNotificacionRepository
from modulos.notificaciones.aplicacion.RegistrarNotificacionUseCase import RegistrarNotificacionUseCase
from modulos.notificaciones.aplicacion.ListarNotificacionesUseCase import ListarNotificacionesUseCase

from .models import NotificacionModel

def _serializar(n) -> dict:
    return {
        'id': str(n.id),
        'usuario_id': n.usuario_id,
        'mensaje': n.mensaje,
        'leido': n.leido,
        'created_at': str(n.created_at) if n.created_at else None
    }

class NotificacionListCreateController(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

    def get(self, request):
        repo = DjangoNotificacionRepository()
        use_case = ListarNotificacionesUseCase(repo)
        items = use_case.ejecutar(request.user.id)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(items, request, view=self)
        if page is not None:
            datos = [_serializar(x) for x in page]
            return paginator.get_paginated_response(datos)
            
        return Response({'ok': True, 'datos': [_serializar(x) for x in items]}, status=200)

    def post(self, request):
        repo = DjangoNotificacionRepository()
        use_case = RegistrarNotificacionUseCase(repo)
        
        if request.user.is_staff or request.user.is_superuser:
            usuario_id = request.data.get('usuario_id', request.user.id)
        else:
            usuario_id = request.user.id
            
        try:
            n = use_case.ejecutar(
                usuario_id=usuario_id,
                mensaje=request.data.get('mensaje', '')
            )
            return Response({'ok': True, 'datos': _serializar(n)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

class NotificacionMarkReadController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notificacion_id):
        repo = DjangoNotificacionRepository()
        es_admin = request.user.is_staff or request.user.is_superuser
        try:
            repo.marcar_como_leida_para_usuario(notificacion_id, request.user.id, es_admin=es_admin)
            return Response({'ok': True, 'mensaje': 'Notificación marcada como leída.'}, status=200)
        except NotificacionModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Notificación no encontrada.'}, status=404)
        except PermissionError:
            return Response({'ok': False, 'error': 'No tienes permiso para marcar esta notificación como leída.'}, status=403)

