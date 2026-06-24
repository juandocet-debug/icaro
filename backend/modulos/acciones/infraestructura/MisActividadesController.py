from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from modulos.acciones.aplicacion.ListarMisActividadesUseCase import ListarMisActividadesUseCase
from modulos.acciones.aplicacion.RegistrarEjecucionActividadUseCase import RegistrarEjecucionActividadUseCase
from modulos.acciones.infraestructura.DjangoAsignacionResponsableRepository import DjangoAsignacionResponsableRepository
from modulos.acciones.infraestructura.models import AccionModel, AsignacionResponsableAccionModel, RequisitoVerificacionAccionModel
from modulos.roles.infraestructura.models import UsuarioRolModel
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from modulos.uploads.infraestructura.models import UploadModel
from modulos.uploads.infraestructura.InspectorArchivoEvidencia import detectar_mime, resolver_mime_zip, inspeccionar
from modulos.auditoria.infraestructura.DjangoAuditLogRepository import DjangoAuditLogRepository
from modulos.auditoria.aplicacion.RegistrarAuditLogUseCase import RegistrarAuditLogUseCase

User = get_user_model()

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

def _verificar_acceso_actividad(usuario, accion_id: str, requiere_permiso: str = None) -> tuple:
    """
    Retorna (accion, asignacion, es_gestor) si el usuario puede acceder a la actividad,
    de lo contrario lanza PermissionError o ValueError.
    """
    try:
        accion = AccionModel.objects.select_related('component', 'component__meta').get(pk=accion_id)
    except AccionModel.DoesNotExist:
        raise ValueError("Actividad no encontrada.")

    proyecto_id = str(accion.component.project_id)

    # Verificar si el usuario es gestor (Superadmin o administrador/coordinador del proyecto)
    es_gestor = False
    if usuario.is_superuser:
        es_gestor = True
    else:
        roles_manager = ['superadministrador', 'administrador_proyecto', 'coordinador_proyecto', 'coordinador_general']
        if UsuarioRolModel.objects.filter(usuario=usuario, proyecto_id=proyecto_id, rol__codigo__in=roles_manager, activo=True).exists():
            es_gestor = True

    # Si se requiere verificar un permiso de rol/proyecto (ej: evidencias.ver o evidencias.subir)
    if requiere_permiso:
        try:
            VerificarPermisoUseCase().ejecutar(usuario.id, requiere_permiso, proyecto_id=proyecto_id)
        except PermissionError as e:
            raise PermissionError(str(e))

    asignacion = None
    if not es_gestor:
        # Se requiere asignación activa
        asignacion = AsignacionResponsableAccionModel.objects.filter(
            accion_id=accion_id,
            usuario=usuario,
            activo=True
        ).first()
        if not asignacion:
            raise PermissionError("No tienes una asignación activa en esta actividad.")

    return accion, asignacion, es_gestor

def _serialize_upload(u):
    accion_id_val = getattr(u, 'action_id', None) or getattr(u, 'accion_id', None)
    requisito_id_val = getattr(u, 'requisito_id', None)
    return {
        'id': str(u.id),
        'accion_id': str(accion_id_val) if accion_id_val else None,
        'requisito_id': str(requisito_id_val) if requisito_id_val else None,
        'file_url': u.file_url,
        'file_name': u.file_name,
        'file_type': u.file_type,
        'file_size': getattr(u, 'file_size', None),
        'fecha_ejecucion': str(u.fecha_ejecucion) if u.fecha_ejecucion else None,
        'observaciones': u.observaciones,
        'status': u.status,
        'created_at': u.created_at.strftime('%d %b %Y') if u.created_at else None,
    }

def _serialize_actividad_detallada(accion, usuario, request=None):
    proyeccion = float(accion.proyeccion_cuantitativa or 0)
    ejecucion = float(accion.ejecucion_acumulada or 0)
    pct = round((ejecucion / proyeccion) * 100, 2) if proyeccion > 0 else 0.0

    # Obtener mi asignación
    asignacion = AsignacionResponsableAccionModel.objects.filter(
        accion=accion,
        usuario=usuario,
        activo=True
    ).first()

    tipo_asig = asignacion.tipo_asignacion if asignacion else None

    # Obtener roles del usuario en el proyecto
    proyecto_id = accion.component.project_id
    roles = list(UsuarioRolModel.objects.filter(
        usuario=usuario,
        proyecto_id=proyecto_id,
        activo=True
    ).values_list('rol__nombre', flat=True))

    # Requisitos de verificación
    requisitos = list(RequisitoVerificacionAccionModel.objects.filter(
        accion=accion,
        activo=True
    ).order_by('orden'))

    total_requisitos = len(requisitos)
    requisitos_cumplidos = 0

    if total_requisitos > 0:
        req_ids = [r.id for r in requisitos]
        from django.db.models import Count
        counts = dict(
            UploadModel.objects.filter(
                action_id=accion.id,
                requisito_id__in=req_ids
            ).values('requisito_id').annotate(total=Count('id')).values_list('requisito_id', 'total')
        )
        for r in requisitos:
            cargados = counts.get(r.id, 0)
            if cargados >= r.min_archivos:
                requisitos_cumplidos += 1

        if requisitos_cumplidos == total_requisitos:
            estado_verif = 'completo'
        elif requisitos_cumplidos == 0:
            estado_verif = 'pendiente'
        else:
            estado_verif = 'incompleto'
    else:
        estado_verif = 'sin_requisitos'

    # Serializar requisitos con conteo + lista de evidencias cargadas
    requisitos_data = []
    if total_requisitos > 0:
        # Precargar todos los uploads de la acción en una sola query
        req_ids = [r.id for r in requisitos]
        all_uploads = list(UploadModel.objects.filter(
            action_id=accion.id, requisito_id__in=req_ids
        ).order_by('created_at'))
        uploads_por_req = {}
        for u in all_uploads:
            uploads_por_req.setdefault(u.requisito_id, []).append(u)

        for r in requisitos:
            cargados = counts.get(r.id, 0)
            evidencias_req = uploads_por_req.get(r.id, [])
            requisitos_data.append({
                'id': str(r.id),
                'nombre': r.nombre,
                'descripcion': r.descripcion,
                'obligatorio': r.obligatorio,
                'tipos_archivo_permitidos': r.tipos_archivo_permitidos,
                'min_archivos': r.min_archivos,
                'max_archivos': r.max_archivos,
                'archivos_cargados': cargados,
                'cumplido': cargados >= r.min_archivos,
                'evidencias': [
                    {
                        'id': str(u.id),
                        'file_name': u.file_name,
                        'file_url': u.file_url,
                        'file_type': u.file_type,
                        'file_size': getattr(u, 'file_size', None),
                        'fecha_ejecucion': str(u.fecha_ejecucion) if u.fecha_ejecucion else None,
                        'observaciones': u.observaciones,
                        'created_at': u.created_at.strftime('%d %b %Y') if u.created_at else None,
                    }
                    for u in evidencias_req
                ],
            })

    # Permisos dinámicos
    es_gestor = usuario.is_superuser or UsuarioRolModel.objects.filter(
        usuario=usuario,
        proyecto_id=proyecto_id,
        rol__codigo__in=['superadministrador', 'administrador_proyecto', 'coordinador_proyecto', 'coordinador_general'],
        activo=True
    ).exists()

    puede_registrar_ejecucion = es_gestor or (tipo_asig == 'responsable')
    # La asignación activa como responsable o apoyo es autorización suficiente para subir evidencias
    puede_subir_evidencia = es_gestor or tipo_asig in ('responsable', 'apoyo')

    return {
        'accion': {
            'id': str(accion.id),
            'nombre': accion.name,
            'descripcion': accion.description,
            'componente_nombre': getattr(accion.component, 'name', ''),
            'meta_nombre': getattr(accion.component.meta, 'nombre', '') if getattr(accion.component, 'meta', None) else '',
            'proyeccion': proyeccion,
            'ejecucion': ejecucion,
            'unidad_medida': accion.unidad_medida or 'unidades',
            'avance_porcentaje': pct,
            'tipos_evidencia_permitidos': getattr(accion, 'tipos_evidencia_permitidos', []) or [],
            'requisitos_verificacion': requisitos_data,
        },
        'mi_asignacion': {
            'tipo': tipo_asig,
            'roles': roles
        },
        'verificacion': {
            'requisitos_cumplidos': requisitos_cumplidos,
            'total_requisitos': total_requisitos,
            'estado': estado_verif
        },
        'puede_registrar_ejecucion': puede_registrar_ejecucion,
        'puede_subir_evidencia': puede_subir_evidencia,
        'es_gestor': es_gestor
    }

class MisActividadesController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, accion_id=None):
        if accion_id:
            # Detalles de una actividad
            try:
                accion, _, _ = _verificar_acceso_actividad(request.user, accion_id)
                return Response({'ok': True, 'datos': _serialize_actividad_detallada(accion, request.user, request)}, status=200)
            except ValueError as e:
                return Response({'ok': False, 'error': str(e)}, status=404)
            except PermissionError as e:
                return Response({'ok': False, 'error': str(e)}, status=403)
        else:
            # Listar mis actividades
            q = request.query_params.get('q', '').strip()
            estado = request.query_params.get('estado', '').strip()
            proyecto_id = request.query_params.get('proyecto_id', '').strip()
            page = int(request.query_params.get('page', 1))
            page_size = 20

            repo = DjangoAsignacionResponsableRepository()
            use_case = ListarMisActividadesUseCase(repo)
            qs = use_case.ejecutar(request.user, q, estado, proyecto_id)
            total = qs.count()

            # Paginación slicing SQL
            offset = (page - 1) * page_size
            items = qs[offset:offset+page_size]

            return Response({
                'ok': True,
                'count': total,
                'datos': [_serialize_actividad_detallada(a, request.user, request) for a in items]
            }, status=200)

class MisActividadesEjecucionController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, accion_id):
        # La asignación activa como responsable es suficiente para registrar ejecución
        try:
            accion, _, _ = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        cantidad = request.data.get('cantidad')
        if cantidad is None:
            return Response({'ok': False, 'error': 'La cantidad es obligatoria.'}, status=400)

        try:
            cantidad_val = float(cantidad)
        except ValueError:
            return Response({'ok': False, 'error': 'La cantidad debe ser un número válido.'}, status=400)

        use_case = RegistrarEjecucionActividadUseCase()
        try:
            accion_actualizada = use_case.ejecutar(request.user, accion_id, cantidad_val)
            
            # Auditoría
            _audit(request, 'REGISTRAR_EJECUCION_ACTIVIDAD', 'Accion', accion_id, {
                'cantidad': cantidad_val,
                'nueva_ejecucion': float(accion_actualizada.ejecucion_acumulada)
            })

            return Response({'ok': True, 'datos': _serialize_actividad_detallada(accion_actualizada, request.user, request)}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

class MisActividadesEvidenciasController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, accion_id):
        # Verificar acceso para ver evidencias
        try:
            accion, _, _ = _verificar_acceso_actividad(request.user, accion_id, requiere_permiso='evidencias.ver')
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        uploads = UploadModel.objects.filter(action_id=accion_id)
        return Response({'ok': True, 'datos': [_serialize_upload(u) for u in uploads]}, status=200)

    @transaction.atomic
    def post(self, request, accion_id):
        # La asignación activa (responsable o apoyo) es autorización suficiente para subir
        try:
            accion, _, _ = _verificar_acceso_actividad(request.user, accion_id)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'ok': False, 'error': 'Se requiere un archivo (campo "archivo").'}, status=400)

        nombre = archivo.name
        tamano = archivo.size

        # Verificar requisitos activos
        tiene_requisitos = RequisitoVerificacionAccionModel.objects.filter(
            accion_id=accion_id, activo=True
        ).exists()

        requisito_id = request.data.get('requisito_id')
        if tiene_requisitos and not requisito_id:
            return Response(
                {'ok': False, 'error': 'Esta acción tiene requisitos configurados. Debe especificar requisito_id.'},
                status=400,
            )

        # Detectar MIME
        mime_real = detectar_mime(archivo)
        if mime_real == 'application/zip_based':
            mime_real = resolver_mime_zip(nombre)
        if not mime_real:
            return Response({'ok': False, 'error': 'Tipo de archivo no reconocido o no permitido.'}, status=400)

        # Validar reglas de dominio de subida
        requisito_obj = None
        archivos_existentes = 0
        if requisito_id:
            try:
                requisito_obj = RequisitoVerificacionAccionModel.objects.select_for_update().get(
                    id=requisito_id, accion_id=accion_id, activo=True
                )
            except RequisitoVerificacionAccionModel.DoesNotExist:
                transaction.set_rollback(True)
                return Response({'ok': False, 'error': 'El requisito no existe o no pertenece a esta acción.'}, status=404)

            archivos_existentes = UploadModel.objects.filter(
                action_id=accion_id, requisito_id=requisito_id
            ).count()

        # Reutilizar RegistrarEvidenciaVerificadaUseCase para validar tamaño y límites
        from modulos.uploads.aplicacion.RegistrarEvidenciaVerificadaUseCase import RegistrarEvidenciaVerificadaUseCase
        req_data = {
            'tipos_archivo_permitidos': requisito_obj.tipos_archivo_permitidos if requisito_obj else [],
            'max_archivos': requisito_obj.max_archivos if requisito_obj else None,
        } if requisito_obj else None

        errores = RegistrarEvidenciaVerificadaUseCase().ejecutar(
            mime_real=mime_real,
            nombre_archivo=nombre,
            tamano=tamano,
            requisito_data=req_data,
            archivos_existentes=archivos_existentes,
        )
        if errores:
            transaction.set_rollback(True)
            return Response({'ok': False, 'errores': errores}, status=400)

        # Validación estructural profunda del archivo
        errores_inspeccion = inspeccionar(archivo, mime_real, nombre)
        if errores_inspeccion:
            transaction.set_rollback(True)
            return Response({'ok': False, 'errores': errores_inspeccion}, status=400)

        # Guardar archivo físico — nombre aleatorio para evitar path traversal
        try:
            import uuid as _uuid, os as _os
            ext = _os.path.splitext(nombre)[1].lower()[:10]  # preserva extensión, máx 10 chars
            safe_name = f"{_uuid.uuid4().hex}{ext}"
            contenido = archivo.read()
            ruta = default_storage.save(f'evidencias/{accion_id}/{safe_name}', ContentFile(contenido))
            try:
                url_archivo = default_storage.url(ruta)
            except Exception:
                url_archivo = f'/media/{ruta}'
        except Exception:
            transaction.set_rollback(True)
            return Response({'ok': False, 'error': 'Error al guardar el archivo.'}, status=400)

        fecha_ejecucion_raw = request.data.get('fecha_ejecucion') or None
        observaciones_raw = request.data.get('observaciones') or None

        # Registrar en la base de datos
        try:
            upload = UploadModel.objects.create(
                action_id=accion_id,
                requisito=requisito_obj,
                uploaded_by=request.user,
                archivo=ruta,
                file_url=url_archivo,
                file_name=nombre,
                file_type=mime_real,
                file_size=tamano,
                fecha_ejecucion=fecha_ejecucion_raw,
                observaciones=observaciones_raw,
                status='pendiente',
            )
        except Exception:
            try:
                default_storage.delete(ruta)
            except Exception:
                pass
            transaction.set_rollback(True)
            return Response({'ok': False, 'error': 'Error al registrar la evidencia.'}, status=400)

        # Auditoría
        _audit(request, 'CARGAR_EVIDENCIA_ACTIVIDAD', 'Upload', str(upload.id), {
            'accion_id': accion_id,
            'requisito_id': str(requisito_id) if requisito_id else None,
            'file_name': nombre,
            'file_type': mime_real,
            'file_size': tamano,
        })

        return Response({'ok': True, 'datos': _serialize_upload(upload)}, status=201)
