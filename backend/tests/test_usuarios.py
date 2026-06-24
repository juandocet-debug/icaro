import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    return User.objects.create_user(username='normaluser', password='password123')

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='adminuser', password='password123', is_staff=True)

@pytest.mark.django_db
def test_nuevo_usuario_no_recibe_is_staff_and_no_asignaciones(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    
    # 1. Superadmin crea usuario
    res = api_client.post(
        '/api/auth/usuarios/',
        data={
            'cedula': '1234567890',
            'first_name': 'Juan',
            'last_name': 'Perez',
            'email': 'juan@example.com',
            'cargo': 'Cargador',
            'is_staff': True  # Debería ignorarse!
        },
        format='json'
    )
    assert res.status_code == 201
    assert res.data['datos']['is_staff'] is False
    
    # 2. Verificar asignaciones iniciales del nuevo usuario
    new_user = User.objects.get(username='1234567890')
    res_asig = api_client.get(f'/api/auth/usuarios/{new_user.id}/asignaciones/')
    assert res_asig.status_code == 200
    assert len(res_asig.data['datos']) == 0

@pytest.mark.django_db
def test_solamente_superadmin_consulta_asignaciones(api_client, test_user, admin_user):
    # 1. Usuario normal intenta consultar
    api_client.force_authenticate(user=test_user)
    res = api_client.get(f'/api/auth/usuarios/{test_user.id}/asignaciones/')
    assert res.status_code == 403

    # 2. Superadmin consulta
    api_client.force_authenticate(user=admin_user)
    res2 = api_client.get(f'/api/auth/usuarios/{test_user.id}/asignaciones/')
    assert res2.status_code == 200
    assert len(res2.data['datos']) == 0
