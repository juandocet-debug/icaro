from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings
from .DjangoSesionRepository import DjangoSesionRepository
from modulos.sesiones.aplicacion.RegistrarSesionUseCase import RegistrarSesionUseCase
from modulos.sesiones.aplicacion.ListarSesionesUseCase import ListarSesionesUseCase

def _serializar(s) -> dict:
    return {
        'id': str(s.id),
        'usuario_id': s.usuario_id,
        'ip_address': s.ip_address,
        'user_agent': s.user_agent,
        'created_at': str(s.created_at) if s.created_at else None
    }

class SesionListCreateController(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

    def get(self, request):
        repo = DjangoSesionRepository()
        use_case = ListarSesionesUseCase(repo)
        items = use_case.ejecutar(request.user.id)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(items, request, view=self)
        if page is not None:
            datos = [_serializar(x) for x in page]
            return paginator.get_paginated_response(datos)
            
        return Response({'ok': True, 'datos': [_serializar(x) for x in items]}, status=200)

    def post(self, request):
        repo = DjangoSesionRepository()
        use_case = RegistrarSesionUseCase(repo)
        try:
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            if ip and ',' in ip:
                ip = ip.split(',')[0].strip()
            ua = request.META.get('HTTP_USER_AGENT', '')
            s = use_case.ejecutar(
                usuario_id=request.user.id,
                token_jti=request.data.get('token_jti', ''),
                ip_address=ip,
                user_agent=ua
            )
            return Response({'ok': True, 'datos': _serializar(s)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
