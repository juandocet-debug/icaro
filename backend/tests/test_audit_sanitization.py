import pytest
import json
from django.test import RequestFactory
from django.http import HttpResponse
from django.contrib.auth.models import AnonymousUser
from modulos.auditoria.infraestructura.models import AuditLogModel as AuditLog
from modulos.auditoria.infraestructura.middleware import AuditLogMiddleware

def dummy_response(request):
    return HttpResponse(json.dumps({"id": "123"}), status=201, content_type='application/json')

@pytest.mark.django_db
def test_post_with_password_redacts_password_value():
    factory = RequestFactory()
    # POST with a payload containing password
    request = factory.post('/api/auth/login/', data={"username": "testuser", "password": "supersecretpassword"}, content_type='application/json')
    request.user = AnonymousUser()
    
    middleware = AuditLogMiddleware(get_response=dummy_response)
    middleware(request)
    
    log = AuditLog.objects.order_by('created_at').last()
    assert log.payload_changes is not None
    assert log.payload_changes["username"] == "testuser"
    assert log.payload_changes["password"] == "[REDACTED]"

@pytest.mark.django_db
def test_nested_payload_with_multiple_sensitive_keys():
    factory = RequestFactory()
    nested_data = {
        "user_info": {
            "email": "user@example.com",
            "secret_key": "mysecretvalue",
            "token": "token123"
        },
        "items": [
            {"name": "item1", "api_key": "key123"},
            {"name": "item2", "refresh": "refresh123"}
        ]
    }
    request = factory.post('/api/proyectos/', data=nested_data, format='json', content_type='application/json')
    request.user = AnonymousUser()
    
    middleware = AuditLogMiddleware(get_response=dummy_response)
    middleware(request)
    
    log = AuditLog.objects.order_by('created_at').last()
    assert log.payload_changes["user_info"]["email"] == "user@example.com"
    assert log.payload_changes["user_info"]["secret_key"] == "[REDACTED]"
    assert log.payload_changes["user_info"]["token"] == "[REDACTED]"
    assert log.payload_changes["items"][0]["api_key"] == "[REDACTED]"
    assert log.payload_changes["items"][1]["refresh"] == "[REDACTED]"

@pytest.mark.django_db
def test_mixed_case_sensitive_keys():
    factory = RequestFactory()
    data = {
        "PassWord": "123",
        "CONTRASena": "abc",
        "JwT": "xyz"
    }
    request = factory.post('/api/proyectos/', data=data, format='json', content_type='application/json')
    request.user = AnonymousUser()
    
    middleware = AuditLogMiddleware(get_response=dummy_response)
    middleware(request)
    
    log = AuditLog.objects.order_by('created_at').last()
    assert log.payload_changes["PassWord"] == "[REDACTED]"
    assert log.payload_changes["CONTRASena"] == "[REDACTED]"
    assert log.payload_changes["JwT"] == "[REDACTED]"

@pytest.mark.django_db
def test_normal_non_sensitive_payload_saved_as_is():
    factory = RequestFactory()
    data = {
        "name": "Proyecto Ficticio",
        "description": "Un gran proyecto",
        "target_quantity": 100
    }
    request = factory.post('/api/proyectos/', data=data, format='json', content_type='application/json')
    request.user = AnonymousUser()
    
    middleware = AuditLogMiddleware(get_response=dummy_response)
    middleware(request)
    
    log = AuditLog.objects.order_by('created_at').last()
    assert log.payload_changes == data

@pytest.mark.django_db
def test_token_auth_endpoints_redacted_entirely():
    factory = RequestFactory()
    
    for path in ['/api/auth/token/', '/api/auth/token/refresh/']:
        request = factory.post(path, data={"username": "user", "password": "pwd", "refresh": "token"}, content_type='application/json')
        request.user = AnonymousUser()
        
        middleware = AuditLogMiddleware(get_response=dummy_response)
        middleware(request)
        
        log = AuditLog.objects.order_by('created_at').last()
        assert log.payload_changes == "[REDACTED]"

@pytest.mark.django_db
def test_audit_logs_post_put_delete_methods():
    factory = RequestFactory()
    middleware = AuditLogMiddleware(get_response=dummy_response)
    
    for method in ['post', 'put', 'delete']:
        request = getattr(factory, method)('/api/proyectos/123/', data={"name": "test"}, content_type='application/json')
        request.user = AnonymousUser()
        
        initial_count = AuditLog.objects.count()
        middleware(request)
        assert AuditLog.objects.count() == initial_count + 1
        assert AuditLog.objects.order_by('created_at').last().metodo_http == method.upper()
