import pytest
from unittest.mock import patch
import json
from django.test import RequestFactory
from django.http import HttpResponse
from django.contrib.auth.models import AnonymousUser
from modulos.auditoria.infraestructura.models import AuditLogModel as AuditLog
from modulos.auditoria.infraestructura.middleware import AuditLogMiddleware

def dynamic_get_response(request):
    if request.method == 'POST':
        return HttpResponse(json.dumps({"id": "post-id-789"}), status=201, content_type='application/json')
    return HttpResponse(status=200)

@pytest.mark.django_db
@pytest.mark.parametrize("method, url, action_name, expected_id", [
    ('post', '/api/proyectos', 'CREAR', 'post-id-789'),
    ('put', '/api/proyectos/12345', 'ACTUALIZAR', '12345'),
    ('patch', '/api/proyectos/12345', 'ACTUALIZAR_PARCIAL', '12345'),
    ('delete', '/api/proyectos/12345', 'ELIMINAR', '12345'),
    ('post', '/api/proyectos/12345/approve', 'CREAR', '12345') # Ruta no CRUD
])
def test_audit_log_middleware_registers_mutable_requests(method, url, action_name, expected_id):
    initial_count = AuditLog.objects.count()
    
    factory = RequestFactory()
    request = getattr(factory, method)(url, data={"test": "data"}, content_type='application/json')
    request.user = AnonymousUser()
    
    middleware = AuditLogMiddleware(get_response=dynamic_get_response)
    response = middleware(request)
    
    # Assert
    assert AuditLog.objects.count() == initial_count + 1
    log = AuditLog.objects.last()
    assert log.metodo_http == method.upper()
    assert log.ruta == url
    assert log.accion == action_name
    assert log.modelo_afectado == 'proyectos'
    assert log.objeto_id == expected_id

@pytest.mark.django_db
def test_audit_log_middleware_does_not_register_get_request():
    initial_count = AuditLog.objects.count()
    
    factory = RequestFactory()
    request = factory.get('/health')
    request.user = AnonymousUser()
    
    middleware = AuditLogMiddleware(get_response=dynamic_get_response)
    response = middleware(request)
    
    # Assert
    assert response.status_code == 200
    assert AuditLog.objects.count() == initial_count

@pytest.mark.django_db
@patch('modulos.auditoria.infraestructura.DjangoAuditLogRepository.DjangoAuditLogRepository.registrar')
def test_audit_log_middleware_exception_does_not_crash_request(mock_create):
    mock_create.side_effect = Exception("Test Error")
    
    factory = RequestFactory()
    request = factory.post('/health', data={"test": "data"}, content_type='application/json')
    request.user = AnonymousUser()
    
    middleware = AuditLogMiddleware(get_response=dynamic_get_response)
    response = middleware(request)
    
    # Assert
    assert response.status_code == 201
