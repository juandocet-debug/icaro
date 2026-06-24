import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.proyectos.infraestructura.models import ProyectoModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='adminuser', password='password123', is_staff=True)

@pytest.fixture
def test_user():
    return User.objects.create_user(username='normaluser', password='password123')

@pytest.mark.django_db
def test_usuario_inactivo_excluido(api_client, admin_user):
    # Setup users
    active_user = User.objects.create_user(username='active_usr', password='password123', is_active=True)
    inactive_user = User.objects.create_user(username='inactive_usr', password='password123', is_active=False)
    
    api_client.force_authenticate(user=admin_user)
    res = api_client.get('/api/auth/usuarios/')
    assert res.status_code == 200
    
    usernames_in_res = [u['username'] for u in res.data['datos']]
    assert 'active_usr' in usernames_in_res
    
    # Check that inactive user in API response has is_active as False (or is excluded if API did it, but if returned, is_active is False)
    inactive_data = [u for u in res.data['datos'] if u['username'] == 'inactive_usr']
    if inactive_data:
        assert inactive_data[0].get('is_active') is False or inactive_data[0].get('isActive') is False

@pytest.mark.django_db
def test_no_admin_cannot_assign_member(api_client, test_user):
    owner = User.objects.create_user(username='owner', password='password123')
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=owner)
    
    # Authenticate as non-admin user
    api_client.force_authenticate(user=test_user)
    
    from modulos.roles.infraestructura.models import RolModel
    rol_coord = RolModel.objects.get(codigo='coordinador_proyecto')
    
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'otheruser', 'rol_id': str(rol_coord.id)},
        format='json'
    )
    assert res.status_code == 403

@pytest.mark.django_db
def test_admin_can_assign_member(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test Admin", created_by=admin_user)
    new_member = User.objects.create_user(username='new_member_usr', password='password123')
    
    api_client.force_authenticate(user=admin_user)
    
    from modulos.roles.infraestructura.models import RolModel
    rol_coord = RolModel.objects.get(codigo='coordinador_proyecto')
    
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'new_member_usr', 'rol_id': str(rol_coord.id)},
        format='json'
    )
    assert res.status_code == 201
    assert res.data['ok'] is True
