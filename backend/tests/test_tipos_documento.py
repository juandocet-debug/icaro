import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.tipos_documento.infraestructura.models import TipoDocumentoModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    return User.objects.create_user(username='normaluser', password='password123')

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='adminuser', password='password123', email='admin@example.com')

@pytest.mark.django_db
def test_tipos_documento_get_without_token_returns_401(api_client):
    user = User.objects.create_user(username='owner', password='password123')
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=user)
    
    res = api_client.get(f'/api/proyectos/{proyecto.id}/tipos-documento/')
    assert res.status_code == 401

@pytest.mark.django_db
def test_tipos_documento_post_normal_user_returns_403(api_client, test_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=test_user)
    api_client.force_authenticate(user=test_user)
    
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/tipos-documento/',
        data={'nombre': 'Acta de Inicio', 'descripcion': 'Documento inicial'},
        format='json'
    )
    assert res.status_code == 403

@pytest.mark.django_db
def test_tipos_documento_post_admin_returns_201_and_delete_returns_200(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    api_client.force_authenticate(user=admin_user)
    
    res_post = api_client.post(
        f'/api/proyectos/{proyecto.id}/tipos-documento/',
        data={'nombre': 'Póliza de Garantía', 'descripcion': 'Garantía del proyecto', 'orden': 1},
        format='json'
    )
    assert res_post.status_code == 201
    assert res_post.data['ok'] is True
    tipo_id = res_post.data['datos']['id']
    
    res_del = api_client.delete(f'/api/proyectos/{proyecto.id}/tipos-documento/{tipo_id}/')
    assert res_del.status_code == 200

@pytest.mark.django_db
def test_tipos_documento_delete_inexistent_returns_404(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    api_client.force_authenticate(user=admin_user)
    
    res = api_client.delete(f'/api/proyectos/{proyecto.id}/tipos-documento/00000000-0000-0000-0000-000000000000/')
    assert res.status_code == 404

@pytest.mark.django_db
def test_tipos_documento_patch_without_token_returns_401(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    tipo = TipoDocumentoModel.objects.create(
        proyecto_id=proyecto.id, nombre="Nombre Viejo", creado_por=admin_user
    )
    res = api_client.patch(
        f'/api/proyectos/{proyecto.id}/tipos-documento/{tipo.id}/',
        data={'nombre': 'Nombre Nuevo'},
        format='json'
    )
    assert res.status_code == 401

@pytest.mark.django_db
def test_tipos_documento_patch_normal_user_returns_403(api_client, test_user, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    tipo = TipoDocumentoModel.objects.create(
        proyecto_id=proyecto.id, nombre="Nombre Viejo", creado_por=admin_user
    )
    api_client.force_authenticate(user=test_user)
    res = api_client.patch(
        f'/api/proyectos/{proyecto.id}/tipos-documento/{tipo.id}/',
        data={'nombre': 'Nombre Nuevo'},
        format='json'
    )
    assert res.status_code == 403

@pytest.mark.django_db
def test_tipos_documento_patch_admin_success(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    tipo = TipoDocumentoModel.objects.create(
        proyecto_id=proyecto.id, nombre="Nombre Viejo", creado_por=admin_user
    )
    api_client.force_authenticate(user=admin_user)
    res = api_client.patch(
        f'/api/proyectos/{proyecto.id}/tipos-documento/{tipo.id}/',
        data={'nombre': 'Nombre Nuevo', 'descripcion': 'Nueva Desc'},
        format='json'
    )
    assert res.status_code == 200
    assert res.data['ok'] is True
    assert res.data['datos']['nombre'] == 'Nombre Nuevo'
    assert res.data['datos']['descripcion'] == 'Nueva Desc'

@pytest.mark.django_db
def test_tipos_documento_patch_empty_name_returns_400(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    tipo = TipoDocumentoModel.objects.create(
        proyecto_id=proyecto.id, nombre="Nombre Viejo", creado_por=admin_user
    )
    api_client.force_authenticate(user=admin_user)
    res = api_client.patch(
        f'/api/proyectos/{proyecto.id}/tipos-documento/{tipo.id}/',
        data={'nombre': '  ', 'descripcion': 'Nueva Desc'},
        format='json'
    )
    assert res.status_code == 400
