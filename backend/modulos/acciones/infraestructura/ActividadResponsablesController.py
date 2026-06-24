from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.contrib.auth import get_user_model

from modulos.acciones.aplicacion.BuscarMiembrosAsignablesUseCase import BuscarMiembrosAsignablesUseCase
from modulos.acciones.aplicacion.AsignarResponsableAccionUseCase import AsignarResponsableAccionUseCase
from modulos.acciones.aplicacion.RetirarResponsableAccionUseCase import RetirarResponsableAccionUseCase
from modulos.acciones.infraestructura.DjangoAsignacionResponsableRepository import DjangoAsignacionResponsableRepository
from modulos.acciones.infraestructura.models import AccionModel, AsignacionResponsableAccionModel
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from modulos.auditoria.infraestructura.DjangoAuditLogRepository import DjangoAuditLogRepository
from modulos.auditoria.aplicacion.RegistrarAuditLogUseCase import RegistrarAuditLogUseCase

User = get_user_model()

def _s_assignment(a, request=None):
    perfil = getattr(a.usuario, 'profile', None)
    nombre = f'{a.usuario.first_name} {a.usuario.last_name}'.strip() or a.usuario.username
    foto_url = None
    if perfil and perfil.photo:
        try:
            foto_url = request.build_absolute_uri(perfil.photo.url) if request else perfil.photo.url
        except Exception:
            pass
    return {
        'id': str(a.id),
        'usuario_id': a.usuario.id,
        'username': a.usuario.username,
        'nombre_completo': nombre,
        'tipo_asignacion': a.tipo_asignacion,
        'activo': a.activo,
        'foto_url': foto_url,
    }

def _s_user(u):
    perfil = getattr(u, 'profile', None)
    nombre = f'{u.first_name} {u.last_name}'.strip() or u.username
    return {
        'id': u.id,
        'username': u.username,
        'nombre_completo': nombre,
        'email': u.email,
    }

def _audit(request, action_name: str, object_id: str, payload: dict):
    try:
        repo = DjangoAuditLogRepository()
        RegistrarAuditLogUseCase(repo).ejecutar(
            accion=action_name,
            metodo_http=request.method,
            ruta=request.path,
            usuario_id=request.user.id,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            modelo_afectado='AsignacionResponsable',
            objeto_id=object_id,
            payload_changes=payload
        )
    except Exception:
        pass

class ActividadResponsablesController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, comp_id, accion_id):
        # Verificar que la acción pertenezca al componente
        try:
            accion = AccionModel.objects.select_related('component').get(pk=accion_id, component_id=comp_id)
        except AccionModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Acción no encontrada en el componente especificado.'}, status=404)

        proyecto_id = str(accion.component.project_id)

        # Verificar permisos
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.ver', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        q = request.query_params.get('q', '').strip()
        buscar_asignables = 'buscar' in request.query_params
        if buscar_asignables:
            # Devuelve miembros del proyecto que pueden ser asignados (con o sin filtro q)
            repo = DjangoAsignacionResponsableRepository()
            use_case = BuscarMiembrosAsignablesUseCase(repo)
            users = use_case.ejecutar(accion_id, q)
            return Response({'ok': True, 'datos': [_s_user(u) for u in users]}, status=200)
        else:
            # Devuelve responsables actualmente asignados a la acción
            assignments_models = AsignacionResponsableAccionModel.objects.filter(
                accion_id=accion_id, activo=True
            ).select_related('usuario', 'usuario__profile')
            return Response({'ok': True, 'datos': [_s_assignment(a, request) for a in assignments_models]}, status=200)

    def post(self, request, comp_id, accion_id):
        try:
            accion = AccionModel.objects.select_related('component').get(pk=accion_id, component_id=comp_id)
        except AccionModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Acción no encontrada.'}, status=404)

        proyecto_id = str(accion.component.project_id)

        # Verificar permisos de asignar
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.asignar_responsables', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        usuario_id = request.data.get('usuario_id')
        tipo_asignacion = request.data.get('tipo_asignacion', 'responsable')

        if not usuario_id:
            return Response({'ok': False, 'error': 'El usuario_id es obligatorio.'}, status=400)

        repo = DjangoAsignacionResponsableRepository()
        use_case = AsignarResponsableAccionUseCase(repo)

        try:
            assignment_domain = use_case.ejecutar(
                accion_id=accion_id,
                usuario_id=int(usuario_id),
                tipo_asignacion=tipo_asignacion,
                assigned_by_id=request.user.id
            )
            assignment_model = AsignacionResponsableAccionModel.objects.select_related('usuario', 'usuario__profile').get(pk=assignment_domain.id)
            
            # Auditoría
            _audit(request, 'ASIGNAR_RESPONSABLE_ACTIVIDAD', str(assignment_model.id), {
                'accion_id': accion_id,
                'usuario_id': usuario_id,
                'tipo_asignacion': tipo_asignacion
            })

            return Response({'ok': True, 'datos': _s_assignment(assignment_model, request)}, status=201)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)

    def delete(self, request, comp_id, accion_id, asignacion_id):
        try:
            accion = AccionModel.objects.select_related('component').get(pk=accion_id, component_id=comp_id)
        except AccionModel.DoesNotExist:
            return Response({'ok': False, 'error': 'Acción no encontrada.'}, status=404)

        proyecto_id = str(accion.component.project_id)

        # Verificar permisos de asignar/retirar
        try:
            VerificarPermisoUseCase().ejecutar(request.user.id, 'acciones.asignar_responsables', proyecto_id=proyecto_id)
        except PermissionError as e:
            return Response({'ok': False, 'error': str(e)}, status=403)

        repo = DjangoAsignacionResponsableRepository()
        use_case = RetirarResponsableAccionUseCase(repo)

        try:
            use_case.ejecutar(asignacion_id)
            
            # Auditoría
            _audit(request, 'RETIRAR_RESPONSABLE_ACTIVIDAD', asignacion_id, {
                'accion_id': accion_id,
                'asignacion_id': asignacion_id
            })

            return Response({'ok': True, 'mensaje': 'Responsable retirado de la actividad.'}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
