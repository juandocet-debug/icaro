from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings
from .DjangoBitacoraRepository import DjangoBitacoraRepository
from modulos.bitacora.aplicacion.RegistrarBitacoraUseCase import RegistrarBitacoraUseCase

def _serializar(b) -> dict:
    return {
        'id': str(b.id),
        'usuario_id': b.usuario_id,
        'descripcion': b.descripcion,
        'created_at': str(b.created_at) if b.created_at else None
    }

class BitacoraListCreateController(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = api_settings.DEFAULT_PAGINATION_CLASS

    def get(self, request):
        from .models import BitacoraModel
        es_admin = request.user.is_staff or request.user.is_superuser
        qs = BitacoraModel.objects.all() if es_admin else BitacoraModel.objects.filter(usuario_id=request.user.id)
        qs = qs.order_by('-created_at')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            return paginator.get_paginated_response([_serializar(x) for x in page])
        return Response({'ok': True, 'datos': [_serializar(x) for x in qs[:100]]}, status=200)


    def post(self, request):
        repo = DjangoBitacoraRepository()
        use_case = RegistrarBitacoraUseCase(repo)
        try:
            b = use_case.ejecutar(
                descripcion=request.data.get('descripcion', ''),
                usuario_id=request.user.id
            )
            return Response({'ok': True, 'datos': _serializar(b)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
