import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.urls import path, include
from rest_framework.views import APIView
from rest_framework.response import Response

# 1. Definir una vista protegida dummy para probar el middleware/permisos globales
class DummyProtectedView(APIView):
    def get(self, request):
        return Response({"message": "Acceso Permitido"})

# 2. Configurar urls de prueba que incluyan la vista protegida Y las reales
from config.urls import urlpatterns as core_urlpatterns
urlpatterns = core_urlpatterns + [
    path('api/test-protected/', DummyProtectedView.as_view(), name='test-protected'),
]

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
@pytest.mark.urls(__name__) # Usar las urls de este archivo (core + dummy)
def test_api_requires_authentication_by_default(api_client):
    # Act
    response = api_client.get('/api/test-protected/')
    # Assert
    assert response.status_code == 401

@pytest.mark.django_db
@pytest.mark.urls(__name__)
def test_api_grants_access_when_authenticated(api_client):
    # Setup
    user = User.objects.create_user(username='testuser', password='password123')
    api_client.force_authenticate(user=user)
    
    # Act
    response = api_client.get('/api/test-protected/')
    # Assert
    assert response.status_code == 200
    assert response.data['message'] == 'Acceso Permitido'

@pytest.mark.django_db
@pytest.mark.urls(__name__)
def test_health_endpoint_is_public(api_client):
    # Act
    response = api_client.get('/health')
    # Assert
    assert response.status_code == 200

@pytest.mark.django_db
@pytest.mark.urls(__name__)
def test_swagger_schema_is_public(api_client):
    # Act
    response = api_client.get('/api/schema/')
    # Assert
    assert response.status_code == 200
