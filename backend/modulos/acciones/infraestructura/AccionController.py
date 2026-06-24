from decimal import Decimal
from django.db import transaction
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .DjangoAccionRepository import DjangoAccionRepository
from .DjangoRequisitoVerificacionRepository import DjangoRequisitoVerificacionRepository
from modulos.acciones.aplicacion.CrearAccionUseCase import CrearAccionUseCase
from modulos.acciones.aplicacion.ActualizarAccionUseCase import ActualizarAccionUseCase
from modulos.acciones.aplicacion.EliminarAccionUseCase import EliminarAccionUseCase
from modulos.acciones.aplicacion.ConfigurarRequisitosVerificacionUseCase import ConfigurarRequisitosVerificacionUseCase
from modulos.proyectos.infraestructura.helpers import check_component_only_access, check_action_access
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from .models import RequisitoVerificacionAccionModel


def _s_requisito(r):
    return {
        'id': str(r.id) if hasattr(r, 'id') and not isinstance(r.id, str) else (r.id if hasattr(r, 'id') else None),
        'nombre': r.nombre,
        'descripcion': r.descripcion,
        'obligatorio': r.obligatorio,
        'tipos_archivo_permitidos': r.tipos_archivo_permitidos,
        'min_archivos': r.min_archivos,
        'max_archivos': r.max_archivos,
        'orden': r.orden,
    }


def _get_requisitos_list(accion_id: str):
    from modulos.uploads.infraestructura.models import UploadModel

    requisitos = list(
        RequisitoVerificacionAccionModel.objects
        .filter(accion_id=accion_id, activo=True)
        .order_by('orden', 'created_at')
        .values('id', 'nombre', 'descripcion', 'obligatorio',
                'tipos_archivo_permitidos', 'min_archivos', 'max_archivos', 'orden')
    )
    if not requisitos:
        return requisitos

    req_ids = [r['id'] for r in requisitos]
    counts = dict(
        UploadModel.objects
        .filter(action_id=accion_id, requisito_id__in=req_ids)
        .values('requisito_id')
        .annotate(total=Count('id'))
        .values_list('requisito_id', 'total')
    )
    for req in requisitos:
        cargados = counts.get(req['id'], 0)
        req['id'] = str(req['id'])
        req['archivos_cargados'] = cargados
        req['cumplido'] = cargados >= req['min_archivos']

    return requisitos


def _s(a, include_requisitos=False):
    pct = None
    if a.proyeccion_cuantitativa and Decimal(str(a.proyeccion_cuantitativa)) > 0:
        pct = round(float(a.ejecucion_acumulada) / float(a.proyeccion_cuantitativa) * 100, 2)

    # Soporta tanto domain entity (componente_id) como ORM model (component_id)
    comp_id_val = getattr(a, 'component_id', None) or getattr(a, 'componente_id', None)
    data = {
        'id': str(a.id),
        'componente_id': str(comp_id_val) if comp_id_val else None,
        'name': a.name,
        'description': a.description,
        'action_type': a.action_type,
        'total_sessions': a.total_sessions,
        'proyeccion_cuantitativa': str(a.proyeccion_cuantitativa) if a.proyeccion_cuantitativa is not None else None,
        'unidad_medida': a.unidad_medida,
        'ejecucion_acumulada': str(a.ejecucion_acumulada),
        'avance_porcentaje': pct,
        'is_transversal': a.is_transversal,
        'display_order': a.display_order,
        'start_date': str(a.start_date) if getattr(a, 'start_date', None) else None,
        'end_date': str(a.end_date) if getattr(a, 'end_date', None) else None,
        'tipos_evidencia_permitidos': getattr(a, 'tipos_evidencia_permitidos', []) or [],
    }
    if include_requisitos:
        # Primeros 3 responsables activos para el nodo del mapa
        from .models import AsignacionResponsableAccionModel
        resp_qs = AsignacionResponsableAccionModel.objects.filter(
            accion_id=a.id, activo=True
        ).select_related('usuario', 'usuario__profile')[:3]
        data['responsables'] = [
            {
                'id': str(r.usuario_id),
                'username': r.usuario.username,
                'nombre_completo': ' '.join(filter(None, [
                    getattr(r.usuario.profile, 'primer_nombre', '') if hasattr(r.usuario, 'profile') else '',
                    getattr(r.usuario.profile, 'primer_apellido', '') if hasattr(r.usuario, 'profile') else '',
                ])).strip() or r.usuario.username,
                'foto_url': None,  # foto_url requiere request; omitida en listado
            }
            for r in resp_qs
        ]
        requisitos = _get_requisitos_list(str(a.id))
        data['requisitos_verificacion'] = requisitos
        total = len(requisitos)
        cumplidos = sum(1 for r in requisitos if r.get('cumplido', False))
        if total == 0:
            estado = 'sin_requisitos'
        elif cumplidos == total:
            estado = 'completo'
        elif cumplidos == 0:
            estado = 'pendiente'
        else:
            estado = 'incompleto'
        data['resumen_verificacion'] = {
            'total_requisitos': total,
            'requisitos_cumplidos': cumplidos,
            'estado': estado,
        }
    else:
        data['requisitos_verificacion'] = []
        data['resumen_verificacion'] = None
        data['responsables'] = []
    return data


class AccionListCreateController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, comp_id):
        try:
            check_component_only_access(comp_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        from .models import AccionModel
        from rest_framework.pagination import PageNumberPagination
        acciones = AccionModel.objects.filter(component_id=comp_id).order_by('display_order', 'created_at')
        paginator = PageNumberPagination()
        paginator.page_size = 50
        paginator.page_size_query_param = 'page_size'
        paginator.max_page_size = 100
        page = paginator.paginate_queryset(acciones, request, view=self)
        if page is not None:
            return paginator.get_paginated_response([_s(a, include_requisitos=True) for a in page])
        datos = [_s(a, include_requisitos=True) for a in acciones]
        return Response({'ok': True, 'datos': datos}, status=200)

    @transaction.atomic
    def post(self, request, comp_id):
        try:
            comp = check_component_only_access(comp_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.crear', proyecto_id=comp.project_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoAccionRepository()
        try:
            a = CrearAccionUseCase(repo).ejecutar(
                componente_id=comp_id,
                name=request.data.get('name', ''),
                description=request.data.get('description'),
                action_type=request.data.get('action_type'),
                total_sessions=request.data.get('total_sessions', 1),
                proyeccion_cuantitativa=request.data.get('proyeccion_cuantitativa'),
                unidad_medida=request.data.get('unidad_medida'),
                ejecucion_acumulada=request.data.get('ejecucion_acumulada', 0),
                is_transversal=request.data.get('is_transversal', False),
                start_date=request.data.get('start_date') or None,
                end_date=request.data.get('end_date') or None,
            )
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

        # Crear requisitos de verificación (en la misma transacción)
        requisitos_data = request.data.get('requisitos_verificacion', [])
        if requisitos_data:
            try:
                req_repo = DjangoRequisitoVerificacionRepository()
                ConfigurarRequisitosVerificacionUseCase(req_repo).ejecutar(
                    str(a.id), requisitos_data
                )
            except ValueError as e:
                transaction.set_rollback(True)  # revierte todo incluyendo la acción
                return Response({'ok': False, 'error': str(e)}, status=400)

        from .models import AccionModel
        tipos_ev = request.data.get('tipos_evidencia_permitidos')
        if tipos_ev is not None:
            AccionModel.objects.filter(id=a.id).update(tipos_evidencia_permitidos=tipos_ev or [])
        accion_obj = AccionModel.objects.get(pk=a.id)
        return Response({'ok': True, 'datos': _s(accion_obj, include_requisitos=True)}, status=201)


class AccionDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, comp_id, accion_id):
        try:
            check_action_access(accion_id, comp_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        from .models import AccionModel
        try:
            a = AccionModel.objects.get(pk=accion_id)
        except AccionModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Accion no encontrada.'}, status=404)
        return Response({'ok': True, 'datos': _s(a, include_requisitos=True)}, status=200)

    def put(self, request, comp_id, accion_id):
        try:
            check_action_access(accion_id, comp_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        try:
            from modulos.componentes.infraestructura.models import ComponenteModel
            comp_obj = ComponenteModel.objects.only('project_id').get(id=comp_id)
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.editar', proyecto_id=str(comp_obj.project_id))
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        except Exception:
            return Response({'ok': False, 'error': 'Error al verificar permisos de edición.'}, status=400)

        repo = DjangoAccionRepository()
        try:
            a = ActualizarAccionUseCase(repo).ejecutar(accion_id, **request.data)
            from .models import AccionModel
            # tipos_evidencia_permitidos está fuera del dominio: actualizar directamente
            if 'tipos_evidencia_permitidos' in request.data:
                AccionModel.objects.filter(id=accion_id).update(
                    tipos_evidencia_permitidos=request.data['tipos_evidencia_permitidos'] or []
                )
            accion_obj = AccionModel.objects.get(pk=a.id)
            return Response({'ok': True, 'datos': _s(accion_obj, include_requisitos=True)}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

    def delete(self, request, comp_id, accion_id):
        try:
            check_action_access(accion_id, comp_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        try:
            from modulos.componentes.infraestructura.models import ComponenteModel
            comp_obj = ComponenteModel.objects.only('project_id').get(id=comp_id)
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.eliminar', proyecto_id=str(comp_obj.project_id))
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        except Exception:
            return Response({'ok': False, 'error': 'Error al verificar permisos de edición.'}, status=400)

        repo = DjangoAccionRepository()
        ok = EliminarAccionUseCase(repo).ejecutar(accion_id)
        if not ok:
            return Response({'ok': False, 'error': 'Accion no encontrada.'}, status=404)
        return Response({'ok': True, 'mensaje': 'Accion eliminada.'}, status=200)


class AccionRequisitosController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, comp_id, accion_id):
        try:
            check_action_access(accion_id, comp_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        requisitos = _get_requisitos_list(accion_id)
        return Response({'ok': True, 'datos': requisitos}, status=200)

    @transaction.atomic
    def put(self, request, comp_id, accion_id):
        try:
            comp = check_action_access(accion_id, comp_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # Verificar permiso de edición
        try:
            from .models import AccionModel
            accion_obj = AccionModel.objects.get(pk=accion_id)
            VerificarPermisoUseCase().ejecutar(
                request.user.id, 'acciones.editar',
                proyecto_id=accion_obj.component.project_id
            )
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        except AccionModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Accion no encontrada.'}, status=404)

        datos = request.data if isinstance(request.data, list) else request.data.get('requisitos_verificacion', [])
        try:
            # Upsert: preserva UUIDs existentes para no romper los UploadModel que los referencian.
            nombres = [d.get('nombre', '').strip() for d in datos]
            if len(nombres) != len(set(nombres)):
                return Response({'ok': False, 'error': 'No pueden existir dos requisitos con el mismo nombre.'}, status=400)

            ids_nuevos = set()
            resultado = []
            for i, d in enumerate(datos):
                req_id = d.get('id')
                campos = dict(
                    nombre=d.get('nombre', '').strip(),
                    descripcion=d.get('descripcion') or None,
                    obligatorio=bool(d.get('obligatorio', True)),
                    tipos_archivo_permitidos=d.get('tipos_archivo_permitidos') or [],
                    min_archivos=int(d.get('min_archivos', 1)),
                    max_archivos=int(d['max_archivos']) if d.get('max_archivos') is not None else None,
                    orden=i,
                    activo=True,
                )
                if req_id:
                    # UPDATE — conserva el UUID → los uploads siguen vinculados
                    RequisitoVerificacionAccionModel.objects.filter(
                        id=req_id, accion_id=accion_id
                    ).update(**campos)
                    obj = RequisitoVerificacionAccionModel.objects.get(id=req_id)
                    ids_nuevos.add(str(req_id))
                else:
                    # CREATE nuevo
                    import uuid as _uuid
                    obj = RequisitoVerificacionAccionModel.objects.create(
                        id=str(_uuid.uuid4()), accion_id=accion_id, **campos
                    )
                    ids_nuevos.add(str(obj.id))
                resultado.append(obj)

            # Eliminar sólo los que ya no están en la lista
            RequisitoVerificacionAccionModel.objects.filter(
                accion_id=accion_id
            ).exclude(id__in=ids_nuevos).delete()

            return Response({'ok': True, 'datos': [_s_requisito(r) for r in resultado]}, status=200)
        except Exception as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
