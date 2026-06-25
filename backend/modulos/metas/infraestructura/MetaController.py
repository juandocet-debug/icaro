from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from modulos.metas.aplicacion.ActualizarMetaUseCase import ActualizarMetaUseCase
from modulos.metas.aplicacion.ArchivarMetaUseCase import ArchivarMetaUseCase
from modulos.metas.aplicacion.CrearMetaUseCase import CrearMetaUseCase
from modulos.metas.aplicacion.EliminarMetaUseCase import EliminarMetaUseCase
from modulos.metas.aplicacion.ListarMetasProyectoUseCase import ListarMetasProyectoUseCase
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from .DjangoMetaRepository import DjangoMetaRepository
from .models import MetaModel


def _s(meta):
    return {'id': str(meta.id), 'proyecto_id': str(meta.proyecto_id), 'nombre': meta.nombre,
            'descripcion': meta.descripcion, 'activo': meta.activo,
            'created_by_id': meta.created_by_id, 'updated_by_id': meta.updated_by_id}


def _s_list(meta_qs_item):
    """Serializa una meta anotada con conteos de componentes y acciones."""
    return {
        'id': str(meta_qs_item.id),
        'proyecto_id': str(meta_qs_item.proyecto_id),
        'nombre': meta_qs_item.nombre,
        'descripcion': meta_qs_item.descripcion,
        'activo': meta_qs_item.activo,
        'created_at': meta_qs_item.created_at.isoformat() if meta_qs_item.created_at else None,
        'cantidad_componentes': meta_qs_item.cantidad_componentes,
        'cantidad_acciones': meta_qs_item.cantidad_acciones,
    }


def _project_access(proyecto_id, user, permission):
    if not ProyectoModel.objects.filter(id=proyecto_id).exists():
        raise ValueError('Proyecto no encontrado.')
    VerificarPermisoUseCase().ejecutar(user.id, permission, proyecto_id=proyecto_id)


def _meta_access(meta_id, proyecto_id, user, permission):
    _project_access(proyecto_id, user, permission)
    try:
        meta = MetaModel.objects.get(id=meta_id, proyecto_id=proyecto_id)
    except (MetaModel.DoesNotExist, ValueError, ValidationError, ObjectDoesNotExist) as exc:
        raise ValueError('Meta no encontrada.') from exc
    return meta


class MetaListCreateController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, proyecto_id):
        try:
            _project_access(proyecto_id, request.user, 'metas.ver')
        except ValueError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=404)
        except PermissionError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=403)

        # Filtrar metas si el usuario está restringido al alcance de componente
        is_restricted = False
        assigned_component_ids = []
        if not request.user.is_superuser:
            from modulos.roles.infraestructura.models import UsuarioRolModel
            project_asigs = UsuarioRolModel.objects.filter(
                usuario=request.user,
                proyecto_id=proyecto_id,
                activo=True,
                rol__activo=True,
                rol__tipo_alcance__in=['global', 'proyecto'],
                rol__permisos_rel__permiso__codigo='metas.ver'
            )
            if not project_asigs.exists():
                comp_asigs = UsuarioRolModel.objects.filter(
                    usuario=request.user,
                    proyecto_id=proyecto_id,
                    activo=True,
                    rol__activo=True,
                    rol__tipo_alcance='componente',
                    rol__permisos_rel__permiso__codigo='metas.ver'
                )
                if comp_asigs.exists():
                    is_restricted = True
                    assigned_component_ids = list(comp_asigs.values_list('componente_id', flat=True))

        repo = DjangoMetaRepository()
        metas_qs = repo.listar_por_proyecto_con_conteos(proyecto_id)
        if is_restricted:
            metas_qs = metas_qs.filter(componentes__id__in=assigned_component_ids).distinct()

        return Response({'ok': True, 'datos': [_s_list(m) for m in metas_qs]})

    def post(self, request, proyecto_id):
        try:
            _project_access(proyecto_id, request.user, 'metas.crear')
            meta = CrearMetaUseCase(DjangoMetaRepository()).ejecutar(
                proyecto_id=proyecto_id, nombre=request.data.get('nombre', ''),
                descripcion=request.data.get('descripcion'), created_by_id=request.user.id)
            return Response({'ok': True, 'datos': _s(meta)}, status=201)
        except ValueError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=400)
        except PermissionError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=403)


class MetaDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, proyecto_id, meta_id):
        try:
            meta = _meta_access(meta_id, proyecto_id, request.user, 'metas.ver')
            
            # Validar alcance de componente
            if not request.user.is_superuser:
                from modulos.roles.infraestructura.models import UsuarioRolModel
                project_asigs = UsuarioRolModel.objects.filter(
                    usuario=request.user,
                    proyecto_id=proyecto_id,
                    activo=True,
                    rol__activo=True,
                    rol__tipo_alcance__in=['global', 'proyecto'],
                    rol__permisos_rel__permiso__codigo='metas.ver'
                )
                if not project_asigs.exists():
                    comp_asigs = UsuarioRolModel.objects.filter(
                        usuario=request.user,
                        proyecto_id=proyecto_id,
                        activo=True,
                        rol__activo=True,
                        rol__tipo_alcance='componente',
                        rol__permisos_rel__permiso__codigo='metas.ver'
                    )
                    if comp_asigs.exists():
                        assigned_component_ids = list(comp_asigs.values_list('componente_id', flat=True))
                        if not meta.componentes.filter(id__in=assigned_component_ids).exists():
                            return Response({'ok': False, 'error': 'No tiene acceso a esta meta.'}, status=403)
        except ValueError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=404)
        except PermissionError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=403)
        return Response({'ok': True, 'datos': _s(meta)})

    def put(self, request, proyecto_id, meta_id):
        return self.patch(request, proyecto_id, meta_id)

    def patch(self, request, proyecto_id, meta_id):
        try:
            _meta_access(meta_id, proyecto_id, request.user, 'metas.editar')
            meta = ActualizarMetaUseCase(DjangoMetaRepository()).ejecutar(
                meta_id, request.user.id, request.data.get('nombre'), request.data.get('descripcion'))
            return Response({'ok': True, 'datos': _s(meta)})
        except ValueError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=400)
        except PermissionError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=403)

    @transaction.atomic
    def delete(self, request, proyecto_id, meta_id):
        try:
            meta = _meta_access(meta_id, proyecto_id, request.user, 'metas.eliminar')
        except ValueError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=404)
        except PermissionError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=403)

        from modulos.componentes.infraestructura.models import ComponenteModel
        force_query = request.query_params.get('force', 'false').lower() == 'true'
        force_body = isinstance(request.data, dict) and request.data.get('force', False)
        force = force_query or force_body

        if ComponenteModel.objects.filter(meta_id=meta.id).exists():
            if not request.user.is_superuser:
                return Response({
                    'ok': False,
                    'error': 'No se puede eliminar la meta porque tiene componentes activos.'
                }, status=409)

        EliminarMetaUseCase(DjangoMetaRepository()).ejecutar(str(meta.id))
        return Response({'ok': True, 'mensaje': 'Meta eliminada.'}, status=200)


class MetaArchivarController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, proyecto_id, meta_id):
        try:
            _meta_access(meta_id, proyecto_id, request.user, 'metas.archivar')
            meta = ArchivarMetaUseCase(DjangoMetaRepository()).ejecutar(meta_id, request.user.id)
            return Response({'ok': True, 'datos': _s(meta), 'mensaje': 'Meta archivada.'})
        except ValueError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=400)
        except PermissionError as exc:
            return Response({'ok': False, 'error': str(exc)}, status=403)
