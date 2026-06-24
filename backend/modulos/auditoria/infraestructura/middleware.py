import json
import logging
import re

logger = logging.getLogger(__name__)

ACCIONES = {
    'POST': 'CREAR',
    'PUT': 'ACTUALIZAR',
    'PATCH': 'ACTUALIZAR_PARCIAL',
    'DELETE': 'ELIMINAR',
}

SENSITIVE_KEYS = {
    'password', 'contraseña', 'contrasena', 'token', 'access', 'refresh', 
    'secret', 'api_key', 'apikey', 'authorization', 'jwt'
}

def _sanitize_payload(payload):
    if isinstance(payload, dict):
        return {str(k): ("[REDACTED]" if any(sk in str(k).lower() for sk in SENSITIVE_KEYS) else _sanitize_payload(v)) for k, v in payload.items()}
    elif isinstance(payload, list):
        return [_sanitize_payload(item) for item in payload]
    return payload

class AuditLogMiddleware:
    '''Middleware transversal que delega la escritura de auditoria al UseCase.'''
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.method not in ACCIONES:
            return response
        
        path_clean = request.path.lower().strip('/')
        if 'metas/' in path_clean and (path_clean.endswith('/archivar') or (request.method == 'DELETE' and re.search(r'metas/\d+$|metas/[0-9a-fA-F\-]{8,}$', path_clean))):
            accion = 'ARCHIVAR'
        else:
            accion = ACCIONES[request.method]
        try:
            payload = None
            path_clean = request.path.lower().strip('/')
            if path_clean in ['api/auth/token', 'api/auth/token/refresh']:
                payload = "[REDACTED]"
            elif request.content_type and 'application/json' in request.content_type:
                try:
                    raw_payload = json.loads(request.body.decode('utf-8'))
                    payload = _sanitize_payload(raw_payload)
                except Exception:
                    pass
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            if ip and ',' in ip:
                ip = ip.split(',')[0].strip()
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            path_parts = [p for p in request.path.strip('/').split('/') if p]
            modelo_afectado = None
            objeto_id = None
            if path_parts:
                id_pattern = re.compile(r'^[0-9a-fA-F\-]{8,}$|^\d+$')
                
                # Check for custom action suffixes to ignore when determining model and ID
                ACTION_SUFFIXES = {'approve', 'archivar', 'read', 'reject', 'portada', 'activar', 'desactivar', 'aprobar', 'rechazar'}
                has_action_suffix = False
                effective_parts = list(path_parts)
                if effective_parts and effective_parts[-1].lower() in ACTION_SUFFIXES:
                    has_action_suffix = True
                    effective_parts.pop()
                
                # Check if this is a POST 201 (creating a resource)
                is_post_201 = (request.method == 'POST' and response.status_code == 201 and not has_action_suffix)
                
                if is_post_201:
                    # The created model is the last non-ID segment in the URL
                    for part in reversed(effective_parts):
                        if not id_pattern.match(part):
                            modelo_afectado = part
                            break
                    # The ID of the created object comes from the response payload (nested or top-level)
                    try:
                        if hasattr(response, 'content') and response.content:
                            resp_data = json.loads(response.content.decode('utf-8'))
                            objeto_id = str(resp_data.get('id') or resp_data.get('datos', {}).get('id') or '') or None
                    except Exception:
                        pass
                else:
                    # For PUT, PATCH, DELETE, or custom POST operations (like archivar)
                    # The object_id is the last ID segment found in the URL.
                    last_id_index = -1
                    for i in range(len(effective_parts) - 1, -1, -1):
                        if id_pattern.match(effective_parts[i]):
                            objeto_id = effective_parts[i]
                            last_id_index = i
                            break
                    
                    if last_id_index != -1:
                        # Find the segment before this ID that is not an ID
                        for j in range(last_id_index - 1, -1, -1):
                            if not id_pattern.match(effective_parts[j]):
                                modelo_afectado = effective_parts[j]
                                break
                    else:
                        # Fallback if no ID in URL
                        if effective_parts:
                            modelo_afectado = effective_parts[-1]
                
                if not modelo_afectado and effective_parts:
                    modelo_afectado = effective_parts[-1]
            from modulos.auditoria.infraestructura.DjangoAuditLogRepository import DjangoAuditLogRepository
            from modulos.auditoria.aplicacion.RegistrarAuditLogUseCase import RegistrarAuditLogUseCase
            repo = DjangoAuditLogRepository()
            caso_uso = RegistrarAuditLogUseCase(repo)
            usuario_id = request.user.id if request.user.is_authenticated else None
            caso_uso.ejecutar(accion=accion, metodo_http=request.method, ruta=request.path,
                usuario_id=usuario_id, ip_address=ip, user_agent=user_agent,
                modelo_afectado=modelo_afectado, objeto_id=objeto_id, payload_changes=payload)
        except Exception as e:
            logger.error(f'Error al registrar auditoria: {e}')
        return response
