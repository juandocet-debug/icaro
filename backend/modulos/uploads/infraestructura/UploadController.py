from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .DjangoUploadRepository import DjangoUploadRepository
from modulos.uploads.aplicacion.ListarUploadsUseCase import ListarUploadsUseCase
from modulos.uploads.aplicacion.EliminarUploadUseCase import EliminarUploadUseCase
from modulos.uploads.aplicacion.RegistrarEvidenciaVerificadaUseCase import RegistrarEvidenciaVerificadaUseCase
from modulos.proyectos.infraestructura.helpers import check_action_only_access, check_upload_access
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from modulos.acciones.infraestructura.models import RequisitoVerificacionAccionModel
from modulos.auditoria.infraestructura.DjangoAuditLogRepository import DjangoAuditLogRepository
from modulos.auditoria.aplicacion.RegistrarAuditLogUseCase import RegistrarAuditLogUseCase
from .models import UploadModel
from .InspectorArchivoEvidencia import detectar_mime, resolver_mime_zip, inspeccionar


def _audit(request, accion: str, modelo: str, objeto_id: str, cambios: dict):
    try:
        repo = DjangoAuditLogRepository()
        RegistrarAuditLogUseCase(repo).ejecutar(
            accion=accion,
            metodo_http=request.method,
            ruta=request.path,
            usuario_id=request.user.id,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            modelo_afectado=modelo,
            objeto_id=objeto_id,
            payload_changes=cambios,
        )
    except Exception:
        pass  # auditoría nunca bloquea la operación principal


def _s(u):
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
        'status': u.status,
    }


def _get_project_id(accion):
    from modulos.componentes.infraestructura.models import ComponenteModel
    comp = ComponenteModel.objects.only('project_id').get(id=accion.component_id)
    return str(comp.project_id)


class UploadListCreateController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, accion_id):
        try:
            accion = check_action_only_access(accion_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            project_id = _get_project_id(accion)
            VerificarPermisoUseCase().ejecutar(request.user.id, 'evidencias.ver', proyecto_id=project_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        except Exception:
            return Response({'ok': False, 'error': 'Error al verificar permisos.'}, status=400)

        repo = DjangoUploadRepository()
        uploads = ListarUploadsUseCase(repo).ejecutar(accion_id)
        return Response({'ok': True, 'datos': [_s(u) for u in uploads]}, status=200)

    @transaction.atomic
    def post(self, request, accion_id):
        # ── 1. Verificar acceso jerárquico ───────────────────────────────────
        try:
            accion = check_action_only_access(accion_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            project_id = _get_project_id(accion)
        except Exception:
            return Response({'ok': False, 'error': 'Componente no encontrado.'}, status=404)

        # ── 2. Verificar permiso evidencias.subir ────────────────────────────
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'evidencias.subir', proyecto_id=project_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # ── 3. Archivo obligatorio ───────────────────────────────────────────
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'ok': False, 'error': 'Se requiere un archivo (campo "archivo").'}, status=400)

        nombre = archivo.name
        tamano = archivo.size

        # ── 4. Verificar si la acción tiene requisitos activos ───────────────
        tiene_requisitos = RequisitoVerificacionAccionModel.objects.filter(
            accion_id=accion_id, activo=True
        ).exists()

        requisito_id = request.data.get('requisito_id')
        if tiene_requisitos and not requisito_id:
            return Response(
                {'ok': False, 'error': 'Esta acción tiene requisitos configurados. Debe especificar requisito_id.'},
                status=400,
            )

        # ── 5. Detectar MIME real desde cabecera ─────────────────────────────
        mime_real = detectar_mime(archivo)
        if mime_real == 'application/zip_based':
            mime_real = resolver_mime_zip(nombre)
        if not mime_real:
            return Response({'ok': False, 'error': 'Tipo de archivo no reconocido o no permitido.'}, status=400)

        # ── 6. Validar reglas de dominio (política + requisito) ──────────────
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

        # ── 7. Validación estructural profunda del archivo ───────────────────
        errores_inspeccion = inspeccionar(archivo, mime_real, nombre)
        if errores_inspeccion:
            transaction.set_rollback(True)
            return Response({'ok': False, 'errores': errores_inspeccion}, status=400)

        # ── 8. Guardar archivo físico ────────────────────────────────────────
        try:
            contenido = archivo.read()
            ruta = default_storage.save(f'evidencias/{accion_id}/{nombre}', ContentFile(contenido))
            try:
                url_archivo = default_storage.url(ruta)
            except Exception:
                url_archivo = f'/media/{ruta}'
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'ok': False, 'error': 'Error al guardar el archivo.'}, status=400)

        # ── 9. Registrar en BD (si falla, limpiar archivo físico) ────────────
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
                status='pendiente',
            )
        except Exception:
            try:
                default_storage.delete(ruta)
            except Exception:
                pass
            transaction.set_rollback(True)
            return Response({'ok': False, 'error': 'Error al registrar la evidencia.'}, status=400)

        # ── 10. Auditoría ────────────────────────────────────────────────────
        _audit(request, 'CREAR', 'Upload', str(upload.id), {
            'accion_id': accion_id,
            'requisito_id': str(requisito_id) if requisito_id else None,
            'file_name': nombre,
            'file_type': mime_real,
            'file_size': tamano,
        })

        return Response({'ok': True, 'datos': _s(upload)}, status=201)


class UploadDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, accion_id, upload_id):
        try:
            upload = check_upload_access(upload_id, accion_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # Verificar permiso evidencias.eliminar
        try:
            from modulos.acciones.infraestructura.models import AccionModel
            from modulos.componentes.infraestructura.models import ComponenteModel
            acc = AccionModel.objects.only('component_id').get(id=accion_id)
            comp = ComponenteModel.objects.only('project_id').get(id=acc.component_id)
            VerificarPermisoUseCase().ejecutar(
                request.user.id, 'evidencias.eliminar', proyecto_id=str(comp.project_id)
            )
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)
        except Exception:
            return Response({'ok': False, 'error': 'Error al verificar permisos de eliminación.'}, status=400)

        # Guardar ruta del archivo antes de eliminar el registro
        ruta_fisica = None
        if upload.archivo:
            try:
                ruta_fisica = upload.archivo.name
            except Exception:
                pass

        repo = DjangoUploadRepository()
        ok = EliminarUploadUseCase(repo).ejecutar(upload_id)
        if not ok:
            return Response({'ok': False, 'error': 'Upload no encontrado.'}, status=404)

        # Eliminar archivo físico tras confirmar la baja en BD
        if ruta_fisica:
            try:
                default_storage.delete(ruta_fisica)
            except Exception:
                pass  # incidente registrado en auditoría

        _audit(request, 'ELIMINAR', 'Upload', upload_id, {
            'accion_id': accion_id,
            'file_name': upload.file_name,
            'file_type': upload.file_type,
        })

        return Response({'ok': True, 'mensaje': 'Upload eliminado.'}, status=200)
