from django.db import transaction
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from modulos.evidencias.infraestructura.models import EvidenciaActividadModel
from modulos.uploads.infraestructura.models import UploadModel
from modulos.uploads.infraestructura.InspectorArchivoEvidencia import detectar_mime, resolver_mime_zip, inspeccionar
from modulos.acciones.infraestructura.models import RequisitoVerificacionAccionModel
from modulos.acciones.infraestructura.MisActividadesController import _verificar_acceso_actividad, _audit

MAX_SOPORTE_MB = 50


def _s_soporte(u):
    return {
        'id': str(u.id),
        'file_name': u.file_name,
        'file_url': u.file_url,
        'file_type': u.file_type,
        'file_size': u.file_size,
        'requisito_id': str(u.requisito_id) if u.requisito_id else None,
        'created_at': u.created_at.strftime('%d %b %Y') if u.created_at else None,
    }


def _s_evidencia(ev):
    creada_por_nombre = ''
    profile = getattr(ev.creada_por, 'profile', None)
    if profile:
        creada_por_nombre = ' '.join(filter(None, [
            getattr(profile, 'primer_nombre', ''),
            getattr(profile, 'primer_apellido', ''),
        ])).strip()
    if not creada_por_nombre:
        creada_por_nombre = ev.creada_por.username

    soportes = list(getattr(ev, '_prefetched_soportes', None) or ev.soportes.order_by('created_at'))
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
        },
        'soportes': [_s_soporte(u) for u in soportes],
        'created_at': ev.created_at.strftime('%d %b %Y') if ev.created_at else None,
    }


def _get_ev(ev_id, accion_id, usuario, es_gestor):
    try:
        ev = EvidenciaActividadModel.objects.select_related(
            'creada_por', 'creada_por__profile'
        ).prefetch_related('soportes').get(id=ev_id, accion_id=accion_id)
    except EvidenciaActividadModel.DoesNotExist:
        raise ValueError('Evidencia no encontrada.')
    if not es_gestor and str(ev.creada_por_id) != str(usuario.id):
        raise PermissionError('No tienes permiso sobre esta evidencia.')
    return ev


def _recalcular_ejecucion_accion(accion_id):
    from django.db.models import Sum
    from modulos.evidencias.infraestructura.models import EvidenciaActividadModel
    from modulos.acciones.infraestructura.models import AccionModel
    
    total_aprobada = EvidenciaActividadModel.objects.filter(
        accion_id=accion_id,
        estado='aprobada'
    ).aggregate(total=Sum('cantidad_ejecutada'))['total'] or 0
    
    AccionModel.objects.filter(id=accion_id).update(ejecucion_acumulada=total_aprobada)


class EvidenciasOperativasListCreateController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, accion_id):
        try:
            _, _, es_gestor = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        qs = EvidenciaActividadModel.objects.filter(accion_id=accion_id).select_related(
            'creada_por', 'creada_por__profile'
        ).prefetch_related('soportes')
        if not es_gestor:
            qs = qs.filter(creada_por=request.user)

        return Response({'ok': True, 'datos': [_s_evidencia(ev) for ev in qs]}, status=200)

    def post(self, request, accion_id):
        try:
            accion, _, _ = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        nombre = (request.data.get('nombre') or '').strip()
        if not nombre:
            return Response({'ok': False, 'error': 'El nombre es obligatorio.'}, status=400)

        # Validar nombre contra tipos_evidencia_permitidos del accion
        tipos_permitidos = getattr(accion, 'tipos_evidencia_permitidos', None) or []
        if tipos_permitidos and nombre not in tipos_permitidos:
            return Response({
                'ok': False,
                'error': f'Tipo no permitido. Opciones: {", ".join(tipos_permitidos)}.',
            }, status=400)

        ev = EvidenciaActividadModel.objects.create(
            accion=accion,
            creada_por=request.user,
            nombre=nombre,
            descripcion=request.data.get('descripcion') or None,
            fecha_ejecucion=request.data.get('fecha_ejecucion') or None,
            cantidad_ejecutada=request.data.get('cantidad_ejecutada') or 0,
            estado='borrador',
        )
        # reload with related data
        ev = EvidenciaActividadModel.objects.select_related(
            'creada_por', 'creada_por__profile'
        ).prefetch_related('soportes').get(id=ev.id)
        _audit(request, 'CREAR_EVIDENCIA_OPERATIVA', 'EvidenciaActividad', str(ev.id), {'nombre': nombre})
        return Response({'ok': True, 'datos': _s_evidencia(ev)}, status=201)


class EvidenciasOperativasDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, accion_id, ev_id):
        try:
            _, _, es_gestor = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            ev = _get_ev(ev_id, accion_id, request.user, es_gestor)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        if ev.estado not in ('borrador', 'reabierta'):
            return Response({'ok': False, 'error': 'Solo se puede editar una evidencia en borrador o reabierta.'}, status=400)

        if 'nombre' in request.data:
            nombre = (request.data.get('nombre') or '').strip()
            if not nombre:
                return Response({'ok': False, 'error': 'El nombre no puede estar vacío.'}, status=400)
            ev.nombre = nombre
        if 'descripcion' in request.data:
            ev.descripcion = request.data.get('descripcion') or None
        if 'fecha_ejecucion' in request.data:
            ev.fecha_ejecucion = request.data.get('fecha_ejecucion') or None
        if 'cantidad_ejecutada' in request.data:
            ev.cantidad_ejecutada = request.data.get('cantidad_ejecutada') or 0
        ev.save()
        return Response({'ok': True, 'datos': _s_evidencia(ev)}, status=200)


class EvidenciasOperativasSoportesController(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, accion_id, ev_id):
        try:
            accion, _, es_gestor = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            ev = _get_ev(ev_id, accion_id, request.user, es_gestor)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        if ev.estado not in ('borrador', 'reabierta'):
            return Response({'ok': False, 'error': 'Solo se pueden agregar soportes en borrador o reabierta.'}, status=400)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'ok': False, 'error': 'Se requiere un archivo (campo "archivo").'}, status=400)

        nombre = archivo.name
        tamano = archivo.size

        if tamano > MAX_SOPORTE_MB * 1024 * 1024:
            return Response({'ok': False, 'error': f'El archivo supera el límite de {MAX_SOPORTE_MB} MB.'}, status=400)

        mime_real = detectar_mime(archivo)
        if mime_real == 'application/zip_based':
            mime_real = resolver_mime_zip(nombre)
        if not mime_real:
            return Response({'ok': False, 'error': 'Tipo de archivo no reconocido o no permitido.'}, status=400)

        requisito_id = request.data.get('requisito_id')
        requisito_obj = None
        if requisito_id:
            try:
                requisito_obj = RequisitoVerificacionAccionModel.objects.get(
                    id=requisito_id, accion_id=accion_id, activo=True
                )
                # Validar tipos permitidos del requisito
                if requisito_obj.tipos_archivo_permitidos:
                    if mime_real not in requisito_obj.tipos_archivo_permitidos:
                        transaction.set_rollback(True)
                        return Response({'ok': False, 'error': f'Tipo de archivo no permitido para este requisito.'}, status=400)
            except RequisitoVerificacionAccionModel.DoesNotExist:
                return Response({'ok': False, 'error': 'Requisito no encontrado.'}, status=404)

        errores_inspeccion = inspeccionar(archivo, mime_real, nombre)
        if errores_inspeccion:
            transaction.set_rollback(True)
            return Response({'ok': False, 'errores': errores_inspeccion}, status=400)

        try:
            import uuid as _uuid, os as _os
            ext = _os.path.splitext(nombre)[1].lower()[:10]
            safe_name = f"{_uuid.uuid4().hex}{ext}"
            contenido = archivo.read()
            ruta = default_storage.save(
                f'evidencias/{accion_id}/{ev_id}/{safe_name}',
                ContentFile(contenido)
            )
            try:
                url_archivo = default_storage.url(ruta)
            except Exception:
                url_archivo = f'/media/{ruta}'
        except Exception:
            transaction.set_rollback(True)
            return Response({'ok': False, 'error': 'Error al guardar el archivo.'}, status=400)

        try:
            upload = UploadModel.objects.create(
                action=accion,
                evidencia_actividad=ev,
                requisito=requisito_obj,
                uploaded_by=request.user,
                archivo=ruta,
                file_url=url_archivo,
                file_name=nombre,
                file_type=mime_real,
                file_size=tamano,
                status='pendiente',
            )
        except Exception:
            try:
                default_storage.delete(ruta)
            except Exception:
                pass
            transaction.set_rollback(True)
            return Response({'ok': False, 'error': 'Error al registrar el soporte.'}, status=400)

        _audit(request, 'AGREGAR_SOPORTE_EVIDENCIA', 'Upload', str(upload.id), {
            'evidencia_id': str(ev_id), 'file_name': nombre, 'file_type': mime_real,
        })
        return Response({'ok': True, 'datos': _s_soporte(upload)}, status=201)

    def delete(self, request, accion_id, ev_id, soporte_id):
        try:
            _, _, es_gestor = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            ev = _get_ev(ev_id, accion_id, request.user, es_gestor)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        if ev.estado not in ('borrador', 'reabierta'):
            return Response({'ok': False, 'error': 'No se pueden eliminar soportes de una evidencia enviada o aprobada.'}, status=400)

        try:
            soporte = UploadModel.objects.get(id=soporte_id, evidencia_actividad=ev)
        except UploadModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Soporte no encontrado.'}, status=404)

        try:
            if soporte.archivo:
                default_storage.delete(soporte.archivo.name)
        except Exception:
            pass
        soporte.delete()
        return Response({'ok': True, 'mensaje': 'Soporte eliminado.'}, status=200)


class EvidenciasOperativasEnviarController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, accion_id, ev_id):
        try:
            _, _, es_gestor = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            ev = _get_ev(ev_id, accion_id, request.user, es_gestor)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        if ev.estado not in ('borrador', 'reabierta'):
            return Response({'ok': False, 'error': f'No se puede enviar desde el estado "{ev.estado}".'}, status=400)

        if ev.soportes.count() == 0:
            return Response({'ok': False, 'error': 'Debe agregar al menos un soporte antes de enviar.'}, status=400)

        ev.estado = 'enviada'
        ev.observacion_coordinador = None
        ev.save(update_fields=['estado', 'observacion_coordinador', 'updated_at'])
        ev = EvidenciaActividadModel.objects.select_related(
            'creada_por', 'creada_por__profile'
        ).prefetch_related('soportes').get(id=ev.id)

        _audit(request, 'ENVIAR_EVIDENCIA_OPERATIVA', 'EvidenciaActividad', str(ev.id), {'estado_nuevo': 'enviada'})
        return Response({'ok': True, 'datos': _s_evidencia(ev)}, status=200)


class EvidenciasOperativasRevisarController(APIView):
    """POST /{ev_id}/revisar/ — coordinador aprueba u observa (solo desde 'enviada')"""
    permission_classes = [IsAuthenticated]

    def post(self, request, accion_id, ev_id):
        try:
            _, _, es_gestor = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        if not es_gestor:
            return Response({'ok': False, 'error': 'Solo coordinadores pueden revisar evidencias.'}, status=403)

        try:
            ev = EvidenciaActividadModel.objects.select_related(
                'creada_por', 'creada_por__profile'
            ).prefetch_related('soportes').get(id=ev_id, accion_id=accion_id)
        except EvidenciaActividadModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Evidencia no encontrada.'}, status=404)

        if ev.estado != 'enviada':
            return Response({'ok': False, 'error': f'Solo se pueden revisar evidencias en estado "enviada". Estado actual: "{ev.estado}".'}, status=400)

        accion_rev = request.data.get('accion')
        if accion_rev not in ('aprobar', 'observar'):
            return Response({'ok': False, 'error': 'Acción inválida. Use "aprobar" u "observar".'}, status=400)

        ev.estado = 'aprobada' if accion_rev == 'aprobar' else 'observada'
        ev.revisada_por = request.user
        if 'observacion' in request.data:
            ev.observacion_coordinador = request.data.get('observacion') or ev.observacion_coordinador
        ev.save(update_fields=['estado', 'revisada_por', 'observacion_coordinador', 'updated_at'])
        
        _recalcular_ejecucion_accion(accion_id)

        _audit(request, 'REVISAR_EVIDENCIA_OPERATIVA', 'EvidenciaActividad', str(ev.id), {
            'accion': accion_rev, 'estado_nuevo': ev.estado,
        })
        return Response({'ok': True, 'datos': _s_evidencia(ev)}, status=200)


class EvidenciasOperativasReabrirController(APIView):
    """POST /{ev_id}/reabrir/ — coordinador reabre desde 'observada' o 'aprobada'"""
    permission_classes = [IsAuthenticated]

    def post(self, request, accion_id, ev_id):
        try:
            _, _, es_gestor = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        if not es_gestor:
            return Response({'ok': False, 'error': 'Solo coordinadores pueden reabrir evidencias.'}, status=403)

        try:
            ev = EvidenciaActividadModel.objects.select_related(
                'creada_por', 'creada_por__profile'
            ).prefetch_related('soportes').get(id=ev_id, accion_id=accion_id)
        except EvidenciaActividadModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Evidencia no encontrada.'}, status=404)

        if ev.estado not in ('observada', 'aprobada'):
            return Response({'ok': False, 'error': f'No se puede reabrir desde el estado "{ev.estado}".'}, status=400)

        ev.estado = 'reabierta'
        if 'observacion' in request.data:
            ev.observacion_coordinador = request.data.get('observacion') or ev.observacion_coordinador
        ev.save(update_fields=['estado', 'observacion_coordinador', 'updated_at'])
        
        _recalcular_ejecucion_accion(accion_id)

        _audit(request, 'REABRIR_EVIDENCIA_OPERATIVA', 'EvidenciaActividad', str(ev.id), {'estado_nuevo': 'reabierta'})
        return Response({'ok': True, 'datos': _s_evidencia(ev)}, status=200)
