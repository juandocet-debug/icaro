import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.urls import path
from rest_framework import generics, serializers
from config.urls import urlpatterns as core_urlpatterns

# 1. Serializador Dummy para listar Usuarios
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

# 2. Vista genérica (ListAPIView automáticamente aplica la paginación global)
class DummyPaginatedView(generics.ListAPIView):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [] # Permitimos AllowAny para saltar la autenticación en esta prueba pura de paginación

# 3. URL de prueba inyectada
urlpatterns = core_urlpatterns + [
    path('api/test-pagination/', DummyPaginatedView.as_view(), name='test-pagination'),
]

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
@pytest.mark.urls(__name__)
def test_global_pagination_is_applied(api_client):
    # Setup: Limpiamos la base de datos de usuarios si hubiera (aunque pytest-django aísla transacciones)
    User.objects.all().delete()
    
    # Creamos 25 usuarios para forzar la creación de al menos 2 páginas completas (tamaño de página = 20)
    users = [User(username=f'user_test_{i}') for i in range(25)]
    User.objects.bulk_create(users)
    
    # Act: Hacemos GET a la ruta
    response = api_client.get('/api/test-pagination/')
    
    # Assert
    assert response.status_code == 200
    
    # Validamos que la respuesta tiene la estructura de paginación dictada por DRF
    assert 'count' in response.data
    assert 'next' in response.data
    assert 'previous' in response.data
    assert 'results' in response.data
    
    # Validamos que el límite global está respetándose
    assert response.data['count'] == 25
    assert len(response.data['results']) == 20
    assert response.data['next'] is not None
