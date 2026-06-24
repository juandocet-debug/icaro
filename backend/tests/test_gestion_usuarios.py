import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.autenticacion.infraestructura.models import ProfileModel
from modulos.proyectos.infraestructura.models import ProyectoModel

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def superadmin():
    u = User.objects.create_superuser(username='11111111', password='password123', email='super@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.primer_nombre = 'Super'
    profile.primer_apellido = 'Admin'
    profile.cedula = '11111111'
    profile.save()
    return u

@pytest.fixture
def other_superadmin():
    u = User.objects.create_superuser(username='22222222', password='password123', email='other_super@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.primer_nombre = 'Other'
    profile.primer_apellido = 'Super'
    profile.cedula = '22222222'
    profile.save()
    return u

@pytest.fixture
def regular_user():
    u = User.objects.create_user(username='33333333', password='password123', email='regular@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.primer_nombre = 'Regular'
    profile.primer_apellido = 'User'
    profile.cedula = '33333333'
    profile.save()
    return u

@pytest.mark.django_db
def test_superadmin_edita_nombre_usuario(api_client, superadmin, regular_user):
    api_client.force_authenticate(user=superadmin)
    res = api_client.put(
        f'/api/auth/usuarios/{regular_user.id}/',
        data={'first_name': 'Juan', 'last_name': 'Perez'},
        format='json'
    )
    assert res.status_code == 200
    regular_user.refresh_from_db()
    assert regular_user.profile.primer_nombre == 'Juan'
    assert regular_user.profile.primer_apellido == 'Perez'

@pytest.mark.django_db
def test_superadmin_edita_email(api_client, superadmin, regular_user):
    api_client.force_authenticate(user=superadmin)
    res = api_client.put(
        f'/api/auth/usuarios/{regular_user.id}/',
        data={'email': 'nuevo@example.com'},
        format='json'
    )
    assert res.status_code == 200
    regular_user.refresh_from_db()
    assert regular_user.email == 'nuevo@example.com'

@pytest.mark.django_db
def test_superadmin_cambia_contrasena(api_client, superadmin, regular_user):
    api_client.force_authenticate(user=superadmin)
    res = api_client.put(
        f'/api/auth/usuarios/{regular_user.id}/',
        data={'password': 'newpassword123'},
        format='json'
    )
    assert res.status_code == 200
    # Verificar que el usuario puede autenticarse con la nueva contraseña
    client2 = APIClient()
    res_login = client2.post(
        '/api/auth/token/',
        data={'username': '33333333', 'password': 'newpassword123'},
        format='json'
    )
    assert res_login.status_code == 200

@pytest.mark.django_db
def test_superadmin_edita_otro_superadmin(api_client, superadmin, other_superadmin):
    api_client.force_authenticate(user=superadmin)
    res = api_client.put(
        f'/api/auth/usuarios/{other_superadmin.id}/',
        data={'first_name': 'OtroNombre'},
        format='json'
    )
    assert res.status_code == 200
    other_superadmin.refresh_from_db()
    assert other_superadmin.profile.primer_nombre == 'OtroNombre'
    assert other_superadmin.is_superuser is True  # No se permite escalada, pero la edición funciona

@pytest.mark.django_db
def test_usuario_no_superadmin_intenta_editar(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    res = api_client.put(
        f'/api/auth/usuarios/{regular_user.id}/',
        data={'first_name': 'Hacker'},
        format='json'
    )
    assert res.status_code == 403

@pytest.mark.django_db
def test_superadmin_elimina_usuario_regular(api_client, superadmin, regular_user):
    api_client.force_authenticate(user=superadmin)
    # Crear un proyecto creado por el usuario regular
    proj = ProyectoModel.objects.create(name="Proyecto Test", created_by=regular_user)
    
    res = api_client.delete(f'/api/auth/usuarios/{regular_user.id}/')
    assert res.status_code == 200
    
    # Verificar eliminación permanente
    assert not User.objects.filter(pk=regular_user.id).exists()
    
    # Verificar reasignación de proyectos
    proj.refresh_from_db()
    assert proj.created_by == superadmin

@pytest.mark.django_db
def test_superadmin_intenta_eliminarse_a_si_mismo(api_client, superadmin):
    api_client.force_authenticate(user=superadmin)
    res = api_client.delete(f'/api/auth/usuarios/{superadmin.id}/')
    assert res.status_code == 400
    assert "No puedes eliminarte a ti mismo" in res.data['error']

@pytest.mark.django_db
def test_superadmin_intenta_eliminar_otro_superadmin(api_client, superadmin, other_superadmin):
    api_client.force_authenticate(user=superadmin)
    res = api_client.delete(f'/api/auth/usuarios/{other_superadmin.id}/')
    assert res.status_code == 400
    assert "No puedes eliminar a otro superadministrador" in res.data['error']

@pytest.mark.django_db
def test_usuario_no_superadmin_intenta_eliminar(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    res = api_client.delete(f'/api/auth/usuarios/{regular_user.id}/')
    assert res.status_code == 403

@pytest.mark.django_db
def test_editar_con_email_duplicado(api_client, superadmin, regular_user, other_superadmin):
    api_client.force_authenticate(user=superadmin)
    res = api_client.put(
        f'/api/auth/usuarios/{regular_user.id}/',
        data={'email': 'other_super@example.com'},
        format='json'
    )
    assert res.status_code == 400
    assert "ya está en uso" in res.data['error']
