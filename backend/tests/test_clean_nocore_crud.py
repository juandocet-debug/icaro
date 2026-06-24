import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

# Imports from infrastructure
from modulos.bitacora.infraestructura.models import BitacoraModel
from modulos.evidencias.infraestructura.models import EvidenciaModel
from modulos.notificaciones.infraestructura.models import NotificacionModel
from modulos.sesiones.infraestructura.models import SesionModel
from modulos.proyectos.infraestructura.models import ProyectoModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    user = User.objects.create_user(username='nocoreuser', password='password123')
    user.is_staff = True
    user.save()
    return user

@pytest.mark.django_db
def test_nocore_endpoints_require_authentication(api_client):
    # GET list endpoints without authentication should return 401
    assert api_client.get('/api/bitacora/').status_code == 401
    assert api_client.get('/api/notificaciones/').status_code == 401
    assert api_client.get('/api/sesiones/').status_code == 401
    assert api_client.get('/api/evidencias/proyecto/12345/').status_code == 401

@pytest.mark.django_db
def test_bitacora_list_create(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # POST to create
    post_data = {"descripcion": "Inicio de sesion de prueba"}
    response = api_client.post('/api/bitacora/', data=post_data, format='json')
    assert response.status_code == 201
    assert response.data['ok'] is True
    assert response.data['datos']['descripcion'] == "Inicio de sesion de prueba"
    assert response.data['datos']['usuario_id'] == test_user.id
    
    # GET list (paginated)
    list_response = api_client.get('/api/bitacora/')
    assert list_response.status_code == 200
    assert 'count' in list_response.data
    assert 'results' in list_response.data
    assert list_response.data['count'] == 1
    assert list_response.data['results'][0]['descripcion'] == "Inicio de sesion de prueba"

@pytest.mark.django_db
def test_evidencia_list_create(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # Setup: Create a project
    proyecto = ProyectoModel.objects.create(name="Proyecto Evidencias", created_by=test_user)
    
    # POST to create evidence
    post_data = {
        "nombre": "Firma de contrato",
        "url": "https://s3.example.com/contrato.pdf"
    }
    response = api_client.post(f'/api/evidencias/proyecto/{proyecto.id}/', data=post_data, format='json')
    assert response.status_code == 201
    assert response.data['ok'] is True
    assert response.data['datos']['nombre'] == "Firma de contrato"
    
    # GET list
    list_response = api_client.get(f'/api/evidencias/proyecto/{proyecto.id}/')
    assert list_response.status_code == 200
    assert 'count' in list_response.data
    assert list_response.data['count'] == 1
    assert list_response.data['results'][0]['nombre'] == "Firma de contrato"

@pytest.mark.django_db
def test_notificaciones_list_create_and_mark_read(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # POST to create notification
    post_data = {"mensaje": "Alerta de sistema"}
    response = api_client.post('/api/notificaciones/', data=post_data, format='json')
    assert response.status_code == 201
    assert response.data['ok'] is True
    assert response.data['datos']['mensaje'] == "Alerta de sistema"
    assert response.data['datos']['leido'] is False
    
    notif_id = response.data['datos']['id']
    
    # POST to mark read
    read_response = api_client.post(f'/api/notificaciones/{notif_id}/read/')
    assert read_response.status_code == 200
    assert read_response.data['ok'] is True
    
    # Verify in list
    list_response = api_client.get('/api/notificaciones/')
    assert list_response.status_code == 200
    assert list_response.data['results'][0]['leido'] is True

@pytest.mark.django_db
def test_sesiones_list_create(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # POST to register session
    post_data = {"token_jti": "jwt-token-id-123456"}
    response = api_client.post('/api/sesiones/', data=post_data, format='json')
    assert response.status_code == 201
    assert response.data['ok'] is True
    assert response.data['datos']['token_jti'] == "jwt-token-id-123456"
    
    # GET list
    list_response = api_client.get('/api/sesiones/')
    assert list_response.status_code == 200
    assert 'results' in list_response.data
    assert list_response.data['results'][0]['token_jti'] == "jwt-token-id-123456"
