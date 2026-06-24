import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.bitacora.infraestructura.models import BitacoraModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_a():
    return User.objects.create_user(username='user_a', password='password123')

@pytest.fixture
def user_b():
    return User.objects.create_user(username='user_b', password='password123')

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='admin_user', password='password123', is_staff=True)

@pytest.mark.django_db
def test_user_a_cannot_see_user_b_bitacora(api_client, user_a, user_b):
    # Setup: Create bitacora records for user A and user B
    BitacoraModel.objects.create(usuario=user_a, descripcion="Log A")
    BitacoraModel.objects.create(usuario=user_b, descripcion="Log B")

    api_client.force_authenticate(user=user_a)
    response = api_client.get('/api/bitacora/')
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['descripcion'] == "Log A"

@pytest.mark.django_db
def test_user_a_can_see_own_bitacora(api_client, user_a):
    BitacoraModel.objects.create(usuario=user_a, descripcion="My Log")
    
    api_client.force_authenticate(user=user_a)
    response = api_client.get('/api/bitacora/')
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['descripcion'] == "My Log"

@pytest.mark.django_db
def test_admin_can_see_all_bitacora(api_client, admin_user, user_a, user_b):
    BitacoraModel.objects.create(usuario=user_a, descripcion="Log A")
    BitacoraModel.objects.create(usuario=user_b, descripcion="Log B")

    api_client.force_authenticate(user=admin_user)
    response = api_client.get('/api/bitacora/')
    assert response.status_code == 200
    assert response.data['count'] == 2

@pytest.mark.django_db
def test_user_cannot_create_bitacora_for_another_user(api_client, user_a, user_b):
    api_client.force_authenticate(user=user_a)
    data = {
        "usuario_id": user_b.id,
        "descripcion": "Log created by A trying to assign to B"
    }
    response = api_client.post('/api/bitacora/', data=data, format='json')
    assert response.status_code == 201
    
    # Check that bitacora was assigned to user A
    bitacora_id = response.data['datos']['id']
    bitacora = BitacoraModel.objects.get(id=bitacora_id)
    assert bitacora.usuario == user_a
    assert bitacora.usuario != user_b

@pytest.mark.django_db
def test_bitacora_list_is_paginated(api_client, user_a):
    for i in range(15):
        BitacoraModel.objects.create(usuario=user_a, descripcion=f"Log {i}")
        
    api_client.force_authenticate(user=user_a)
    response = api_client.get('/api/bitacora/')
    assert response.status_code == 200
    assert 'count' in response.data
    assert 'results' in response.data

@pytest.mark.django_db
def test_unauthenticated_user_receives_401(api_client):
    response = api_client.get('/api/bitacora/')
    assert response.status_code == 401
