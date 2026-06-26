from django.db import transaction
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from modulos.evidencias.infraestructura.models import EvidenciaActividadModel
from modulos.roles.infraestructura.models import UsuarioRolModel
from modulos.proyectos.infraestructura.helpers import check_project_access
from modulos.auditoria.infraestructura.DjangoAuditLogRepository import DjangoAuditLogRepository
from modulos.auditoria.aplicacion.RegistrarAuditLogUseCase import RegistrarAuditLogUseCase

DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 100


def _positive_int(value, default, max_value=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    if parsed < 1:
        return default
    return min(parsed, max_value) if max_value else parsed


def _audit(request, action_name: str, model_name: str, object_id: str, payload: dict):
    try:
        repo = DjangoAuditLogRepository()
        RegistrarAuditLogUseCase(repo).ejecutar(
            accion=action_name,
            metodo_http=request.method,
            ruta=request.path,
            usuario_id=request.user.id,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            modelo_afectado=model_name,
            objeto_id=object_id,
            payload_changes=payload
        )
    except Exception:
        pass


def _serialize_soporte(u):
    return {
        'id': str(u.id),
        'file_name': u.file_name,
        'file_url': u.file_url,
        'file_type': u.file_type,
        'file_size': u.file_size,
        'requisito_id': str(u.requisito_id) if u.requisito_id else None,
        'requisito_nombre': u.requisito.nombre if u.requisito else None,
        'created_at': u.created_at.strftime('%d %b %Y') if u.created_at else None,
    }


def _serialize_evidencia_general(ev):
    creada_por_nombre = ''
    photo_url = None
    profile = getattr(ev.creada_por, 'profile', None)
    if profile:
        creada_por_nombre = ' '.join(filter(None, [
            getattr(profile, 'primer_nombre', ''),
            getattr(profile, 'primer_apellido', ''),
        ])).strip()
        if profile.photo:
            try:
                photo_url = profile.photo.url
            except Exception:
                pass
    if not creada_por_nombre:
        creada_por_nombre = ev.creada_por.username

    soportes = list(ev.soportes.all())

    meta_nombre = ''
    componente_nombre = ''
    if ev.accion and ev.accion.component:
        componente_nombre = ev.accion.component.name or ''
        if ev.accion.component.meta:
            meta_nombre = ev.accion.component.meta.nombre or ''

    return {
        'id': str(ev.id),
        'nombre': ev.nombre,
        'descripcion': ev.descripcion,
        'fecha_ejecucion': str(ev.fecha_ejecucion) if ev.fecha_ejecucion else None,
        'cantidad_ejecutada': float(ev.cantidad_ejecutada),
        'estado': ev.estado,
        'observacion_coordinador': ev.observacion_coordinador,
        'creada_por': {
            'id': str(ev.creada_por_id),
            'nombre': creada_por_nombre,
            'email': ev.creada_por.email,
            'photo_url': photo_url,
        },
        'accion': {
            'id': str(ev.accion_id),
            'nombre': ev.accion.name if ev.accion else '',
            'meta_nombre': meta_nombre,
            'componente_nombre': componente_nombre,
            'requisitos': [
                {
                    'id': str(r.id),
                    'nombre': r.nombre,
                    'obligatorio': r.obligatorio,
                    'min_archivos': r.min_archivos,
                }
                for r in (getattr(ev.accion, 'requisitos_activos', []) if ev.accion else [])
            ],
        },
        'grupo': {
            'id': str(ev.grupo.id),
            'nombre': ev.grupo.nombre,
            'codigo': ev.grupo.codigo,
        } if ev.grupo else None,
        'soportes': [_serialize_soporte(u) for u in soportes],
        'created_at': ev.created_at.strftime('%d %b %Y') if ev.created_at else None,
    }


class EvidenciasOperativasGeneralController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, proyecto_id):
        # ── 1. Verificar acceso al proyecto ──────────────────────────────────
        try:
            check_project_access(proyecto_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # ── 2. Determinar nivel de acceso ─────────────────────────────────────
        es_gestor = False
        componentes_restringidos = None  # None = ve todo el proyecto

        if request.user.is_superuser:
            es_gestor = True
        else:
            roles_manager = [
                'superadministrador', 'administrador_proyecto',
                'coordinador_proyecto', 'coordinador_general',
            ]
            if UsuarioRolModel.objects.filter(
                usuario=request.user,
                proyecto_id=proyecto_id,
                rol__codigo__in=roles_manager,
                activo=True,
            ).exists():
                es_gestor = True
            else:
                # coordinador_componente: acceso acotado a sus componentes asignados
                comp_ids = list(
                    UsuarioRolModel.objects.filter(
                        usuario=request.user,
                        proyecto_id=proyecto_id,
                        rol__codigo='coordinador_componente',
                        activo=True,
                        componente_id__isnull=False,
                    ).values_list('componente_id', flat=True)
                )
                if comp_ids:
                    es_gestor = True
                    componentes_restringidos = comp_ids  # Solo sus componentes

        if not es_gestor:
            return Response({'ok': False, 'error': 'No tienes permisos de gestor en este proyecto.'}, status=403)


        from django.db.models import Count, Prefetch
        from modulos.acciones.infraestructura.models import RequisitoVerificacionAccionModel

        qs = EvidenciaActividadModel.objects.filter(
            accion__component__project_id=proyecto_id
        ).select_related(
            'creada_por', 'creada_por__profile',
            'accion', 'accion__component', 'accion__component__meta', 'grupo',
        ).prefetch_related(
            'soportes', 'soportes__requisito',
            Prefetch(
                'accion__requisitos',
                queryset=RequisitoVerificacionAccionModel.objects.filter(activo=True).order_by('orden'),
                to_attr='requisitos_activos',
            ),
        )

        # Filtro de componente para coordinador_componente
        if componentes_restringidos is not None:
            qs = qs.filter(accion__component_id__in=componentes_restringidos)

        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        fecha_desde = request.query_params.get('fecha_desde')
        if fecha_desde:
            qs = qs.filter(fecha_ejecucion__gte=fecha_desde)

        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_hasta:
            qs = qs.filter(fecha_ejecucion__lte=fecha_hasta)

        grupo_id = request.query_params.get('grupo_id')
        if grupo_id:
            qs = qs.filter(grupo_id=grupo_id)

        q = (request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(nombre__icontains=q)

        if request.query_params.get('summary') == '1':
            estados = dict(qs.values_list('estado').annotate(total=Count('id')))
            return Response({
                'ok': True,
                'datos': [],
                'count': sum(estados.values()),
                'summary': {
                    'aprobadas': estados.get('aprobada', 0),
                    'revision': estados.get('enviada', 0),
                    'pendientes': (
                        estados.get('borrador', 0)
                        + estados.get('observada', 0)
                        + estados.get('reabierta', 0)
                    ),
                    'por_estado': estados,
                },
            }, status=200)

        page = _positive_int(request.query_params.get('page'), 1)
        page_size = _positive_int(
            request.query_params.get('page_size'),
            DEFAULT_PAGE_SIZE,
            MAX_PAGE_SIZE,
        )
        offset = (page - 1) * page_size
        total = qs.count()
        items = list(qs[offset:offset + page_size])
        base_url = request.build_absolute_uri(request.path)
        next_url = f'{base_url}?page={page + 1}&page_size={page_size}' if offset + page_size < total else None
        prev_url = f'{base_url}?page={page - 1}&page_size={page_size}' if page > 1 else None

        return Response({
            'ok': True,
            'count': total,
            'next': next_url,
            'previous': prev_url,
            'page': page,
            'page_size': page_size,
            'datos': [_serialize_evidencia_general(ev) for ev in items],
        }, status=200)

    @transaction.atomic
    def delete(self, request, proyecto_id, ev_id):
        is_super_admin = request.user.is_superuser
        if not is_super_admin:
            is_super_admin = UsuarioRolModel.objects.filter(
                usuario=request.user,
                proyecto_id=proyecto_id,
                rol__codigo='superadministrador',
                activo=True,
            ).exists()

        if not is_super_admin:
            return Response({'ok': False, 'error': 'Solo el super administrador puede borrar una evidencia.'}, status=403)

        try:
            ev = EvidenciaActividadModel.objects.prefetch_related('soportes').get(
                id=ev_id, accion__component__project_id=proyecto_id
            )
        except EvidenciaActividadModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Evidencia no encontrada.'}, status=404)

        for soporte in ev.soportes.all():
            try:
                if soporte.archivo:
                    default_storage.delete(soporte.archivo.name)
            except Exception:
                pass
            soporte.delete()

        ev_id_str = str(ev.id)
        ev_nombre = ev.nombre
        ev.delete()

        _audit(request, 'BORRAR_EVIDENCIA_OPERATIVA', 'EvidenciaActividad', ev_id_str, {'nombre': ev_nombre})
        return Response({'ok': True, 'mensaje': 'Evidencia eliminada completamente.'}, status=200)
