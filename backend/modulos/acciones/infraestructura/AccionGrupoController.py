from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.paginator import Paginator

from modulos.proyectos.infraestructura.helpers import check_action_only_access
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from modulos.auditoria.infraestructura.DjangoAuditLogRepository import DjangoAuditLogRepository
from modulos.auditoria.aplicacion.RegistrarAuditLogUseCase import RegistrarAuditLogUseCase

from modulos.acciones.aplicacion.CrearGrupoAccionUseCase import CrearGrupoAccionUseCase
from modulos.acciones.aplicacion.ActualizarGrupoAccionUseCase import ActualizarGrupoAccionUseCase
from modulos.acciones.aplicacion.ListarGruposAccionUseCase import ListarGruposAccionUseCase
from modulos.acciones.aplicacion.DesactivarGrupoAccionUseCase import DesactivarGrupoAccionUseCase
from modulos.acciones.infraestructura.models import AccionGrupoModel

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

def _s_grupo(g):
    return {
        'id': str(g.id),
        'accion_id': str(g.accion_id),
        'nombre': g.nombre,
        'codigo': g.codigo,
        'descripcion': g.descripcion,
        'activo': g.activo,
        'created_at': g.created_at.isoformat() if g.created_at else None,
        'updated_at': g.updated_at.isoformat() if g.updated_at else None,
    }

class AccionGrupoListCreateController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, accion_id):
        try:
            check_action_only_access(accion_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        q = request.query_params.get('q', '')
        activo_param = request.query_params.get('activo')
        activo = None
        if activo_param is not None:
            activo = activo_param.lower() in ('true', '1')

        qs = ListarGruposAccionUseCase().ejecutar(accion_id, q=q, activo=activo)

        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            page = 1
            page_size = 20

        paginator = Paginator(qs, page_size)
        try:
            paginated_qs = paginator.page(page)
        except Exception:
            paginated_qs = paginator.page(1)

        return Response({
            'ok': True,
            'datos': [_s_grupo(g) for g in paginated_qs],
            'total': paginator.count,
            'total_paginas': paginator.num_pages,
            'pagina_actual': paginated_qs.number,
        }, status=200)

    @transaction.atomic
    def post(self, request, accion_id):
        try:
            action = check_action_only_access(accion_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # Solo coordinadores/admins con permiso
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.editar', proyecto_id=action.component.project_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        nombre = request.data.get('nombre')
        codigo = request.data.get('codigo')
        descripcion = request.data.get('descripcion')

        try:
            grupo = CrearGrupoAccionUseCase().ejecutar(
                accion_id=accion_id,
                nombre=nombre,
                codigo=codigo,
                descripcion=descripcion
            )
            _audit(request, 'CREAR_GRUPO_ACCION', 'AccionGrupo', str(grupo.id), {
                'nombre': grupo.nombre,
                'codigo': grupo.codigo,
            })
            return Response({'ok': True, 'datos': _s_grupo(grupo)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)


class AccionGrupoDetailController(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, accion_id, grupo_id):
        try:
            action = check_action_only_access(accion_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.editar', proyecto_id=action.component.project_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # Validar que el grupo pertenezca a la acción
        try:
            grupo = AccionGrupoModel.objects.get(pk=grupo_id, accion_id=accion_id)
        except AccionGrupoModel.DoesNotExist:
            return Response({'ok': False, 'error': 'El grupo no pertenece a la acción especificada.'}, status=404)

        nombre = request.data.get('nombre')
        codigo = request.data.get('codigo')
        descripcion = request.data.get('descripcion')
        activo = request.data.get('activo')

        try:
            grupo_actualizado = ActualizarGrupoAccionUseCase().ejecutar(
                grupo_id=grupo_id,
                nombre=nombre,
                codigo=codigo,
                descripcion=descripcion,
                activo=activo
            )
            _audit(request, 'ACTUALIZAR_GRUPO_ACCION', 'AccionGrupo', str(grupo_actualizado.id), request.data)
            return Response({'ok': True, 'datos': _s_grupo(grupo_actualizado)}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

    @transaction.atomic
    def delete(self, request, accion_id, grupo_id):
        try:
            action = check_action_only_access(accion_id, request.user)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=404)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.editar', proyecto_id=action.component.project_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        # Validar que el grupo pertenezca a la acción
        try:
            grupo = AccionGrupoModel.objects.get(pk=grupo_id, accion_id=accion_id)
        except AccionGrupoModel.DoesNotExist:
            return Response({'ok': False, 'error': 'El grupo no pertenece a la acción especificada.'}, status=404)

        try:
            grupo_retorno, deleted_physically = DesactivarGrupoAccionUseCase().ejecutar(grupo_id)
            if deleted_physically:
                _audit(request, 'ELIMINAR_FISICO_GRUPO_ACCION', 'AccionGrupo', grupo_id, {'nombre': grupo.nombre})
                return Response({'ok': True, 'mensaje': 'Grupo eliminado físicamente.'}, status=200)
            else:
                _audit(request, 'DESACTIVAR_LOGICO_GRUPO_ACCION', 'AccionGrupo', grupo_id, {'nombre': grupo.nombre, 'activo': False})
                return Response({'ok': True, 'datos': _s_grupo(grupo_retorno), 'mensaje': 'Grupo desactivado lógicamente por contener evidencias.'}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
