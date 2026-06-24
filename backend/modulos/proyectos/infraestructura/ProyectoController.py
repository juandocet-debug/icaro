from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.files.storage import default_storage
from .DjangoProyectoRepository import DjangoProyectoRepository
from modulos.proyectos.aplicacion.CrearProyectoUseCase import CrearProyectoUseCase
from modulos.proyectos.aplicacion.ListarProyectosUseCase import ListarProyectosUseCase
from modulos.proyectos.aplicacion.ObtenerProyectoUseCase import ObtenerProyectoUseCase
from modulos.proyectos.aplicacion.ActualizarProyectoUseCase import ActualizarProyectoUseCase
from modulos.proyectos.aplicacion.EliminarProyectoUseCase import EliminarProyectoUseCase

def _s(p, request=None):
    cover_url = None
    cover_image = None
    if hasattr(p, 'cover_image'):
        cover_image = p.cover_image
    else:
        from .models import ProyectoModel
        try:
            db_obj = ProyectoModel.objects.filter(id=p.id).only('cover_image').first()
            if db_obj:
                cover_image = db_obj.cover_image
        except Exception:
            pass

    if cover_image:
        try:
            cover_url = cover_image.url
        except Exception:
            cover_url = None

    return {
        'id': str(p.id), 'name': p.name,
        'contract_number': p.contract_number,
        'contract_object': p.contract_object,
        'description': p.description, 'status': p.status,
        'start_date': str(p.start_date) if p.start_date else None,
        'end_date': str(p.end_date) if p.end_date else None,
        'created_by_id': p.created_by_id,
        'cover_image_url': cover_url,
    }

class ProyectoListCreateController(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        repo = DjangoProyectoRepository()
        es_admin = request.user.is_staff or request.user.is_superuser
        try:
            page = int(request.query_params.get('page', 1))
            if page < 1:
                page = 1
        except ValueError:
            page = 1
        try:
            page_size = int(request.query_params.get('page_size', 20))
            if page_size < 1 or page_size > 100:
                page_size = 20
        except ValueError:
            page_size = 20
        limit = page_size
        offset = (page - 1) * page_size
        res = ListarProyectosUseCase(repo).ejecutar(
            user_id=request.user.id, es_admin=es_admin, limit=limit, offset=offset
        )
        total = res["total"]
        items = res["items"]
        base_url = request.build_absolute_uri(request.path)
        next_url = f"{base_url}?page={page + 1}&page_size={page_size}" if offset + limit < total else None
        prev_url = f"{base_url}?page={page - 1}&page_size={page_size}" if page > 1 else None
        datos = [_s(p) for p in items]
        return Response({
            'ok': True,
            'count': total,
            'next': next_url,
            'previous': prev_url,
            'datos': datos,
            'results': datos
        }, status=200)
    def post(self, request):
        from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'proyectos.crear')
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoProyectoRepository()
        try:
            # Ignorar created_by_id enviado en body/data
            p = CrearProyectoUseCase(repo).ejecutar(
                name=request.data.get('name',''), created_by_id=request.user.id,
                contract_number=request.data.get('contract_number'),
                description=request.data.get('description'),
                status=request.data.get('status','activo'))
            return Response({'ok':True,'datos':_s(p)},status=201)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=400)

class ProyectoDetailController(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, proyecto_id):
        repo = DjangoProyectoRepository()
        es_admin = request.user.is_staff or request.user.is_superuser
        try:
            p = ObtenerProyectoUseCase(repo).ejecutar(proyecto_id, user_id=request.user.id, es_admin=es_admin)
            return Response({'ok':True,'datos':_s(p)},status=200)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)
    def put(self, request, proyecto_id):
        repo = DjangoProyectoRepository()
        es_admin = request.user.is_staff or request.user.is_superuser
        try:
            # Asegurar que no se modifique created_by_id desde el body
            campos = dict(request.data)
            campos.pop('created_by_id', None)
            campos.pop('created_by', None)
            p = ActualizarProyectoUseCase(repo).ejecutar(proyecto_id, user_id=request.user.id, es_admin=es_admin, **campos)
            return Response({'ok':True,'datos':_s(p)},status=200)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)
    def delete(self, request, proyecto_id):
        if not request.user.is_superuser:
            return Response({'ok': False, 'error': 'Solo el superadministrador puede eliminar proyectos.'}, status=403)

        repo = DjangoProyectoRepository()
        try:
            ok = EliminarProyectoUseCase(repo).ejecutar(proyecto_id, user_id=request.user.id, es_admin=True)
            if not ok: return Response({'ok':False,'error':'Proyecto no encontrado.'},status=404)
            return Response({'ok':True,'mensaje':'Proyecto eliminado.'},status=200)
        except PermissionError as e:
            return Response({'ok':False,'error':str(e)},status=403)
        except ValueError as e:
            return Response({'ok':False,'error':str(e)},status=404)

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

class ProyectoPortadaController(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, proyecto_id):
        archivo = request.FILES.get('portada')
        if not archivo:
            return Response({'ok': False, 'error': 'No se envió ningún archivo.'}, status=400)
        if archivo.content_type not in ALLOWED_IMAGE_TYPES:
            return Response({'ok': False,
                'error': f'Tipo de archivo no permitido: {archivo.content_type}. '
                         f'Use jpg, png o webp.'}, status=400)
        if archivo.size > MAX_IMAGE_SIZE:
            return Response({'ok': False,
                'error': f'El archivo supera el límite de 5MB.'}, status=400)

        from .models import ProyectoModel
        try:
            proyecto = ProyectoModel.objects.get(pk=proyecto_id)
        except ProyectoModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Proyecto no encontrado.'}, status=404)

        if proyecto.cover_image:
            try:
                proyecto.cover_image.delete(save=False)
            except Exception:
                pass

        proyecto.cover_image = archivo
        proyecto.save(update_fields=['cover_image'])
        return Response({'ok': True, 'datos': _s(proyecto)}, status=200)

class ProyectoStatsController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, proyecto_id):
        from modulos.proyectos.infraestructura.helpers import check_project_access
        try:
            check_project_access(proyecto_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        from modulos.metas.infraestructura.models import MetaModel
        from modulos.componentes.infraestructura.models import ComponenteModel
        from modulos.acciones.infraestructura.models import AccionModel
        from django.db.models import Avg

        metas_count = MetaModel.objects.filter(proyecto_id=proyecto_id, activo=True).count()
        componentes_count = ComponenteModel.objects.filter(proyecto_id=proyecto_id).count()
        acciones_qs = AccionModel.objects.filter(component__proyecto_id=proyecto_id)
        acciones_count = acciones_qs.count()
        avg_progress = acciones_qs.aggregate(Avg('avance_porcentaje'))['avance_porcentaje__avg'] or 0

        return Response({
            'ok': True,
            'datos': {
                'metasCount': metas_count,
                'compsCount': componentes_count,
                'accsCount': acciones_count,
                'averageProgress': round(avg_progress, 2)
            }
        }, status=200)
