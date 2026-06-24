import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from modulos.proyectos.infraestructura.models import ProyectoModel

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
def test_upload_portada_without_token_returns_401(api_client):
    user = User.objects.create_user(username='owner', password='password123')
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=user)
    
    file = SimpleUploadedFile("cover.jpg", b"fake_image", content_type="image/jpeg")
    res = api_client.patch(f'/api/proyectos/{proyecto.id}/portada/', {'portada': file}, format='multipart')
    assert res.status_code == 401

@pytest.mark.django_db
def test_upload_portada_normal_user_returns_403(api_client, test_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=test_user)
    api_client.force_authenticate(user=test_user)
    
    file = SimpleUploadedFile("cover.jpg", b"fake_image", content_type="image/jpeg")
    res = api_client.patch(f'/api/proyectos/{proyecto.id}/portada/', {'portada': file}, format='multipart')
    assert res.status_code == 403

@pytest.mark.django_db
def test_upload_portada_non_image_returns_400(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    api_client.force_authenticate(user=admin_user)
    
    file = SimpleUploadedFile("document.txt", b"plain text", content_type="text/plain")
    res = api_client.patch(f'/api/proyectos/{proyecto.id}/portada/', {'portada': file}, format='multipart')
    assert res.status_code == 400

@pytest.mark.django_db
def test_upload_portada_too_large_returns_400(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    api_client.force_authenticate(user=admin_user)
    
    file = SimpleUploadedFile("cover.jpg", b"x" * (21 * 1024 * 1024), content_type="image/jpeg")
    res = api_client.patch(f'/api/proyectos/{proyecto.id}/portada/', {'portada': file}, format='multipart')
    assert res.status_code == 400

@pytest.mark.django_db
def test_upload_portada_admin_success(api_client, admin_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    api_client.force_authenticate(user=admin_user)
    
    file = SimpleUploadedFile("cover.jpg", b"fake_image", content_type="image/jpeg")
    res = api_client.patch(f'/api/proyectos/{proyecto.id}/portada/', {'portada': file}, format='multipart')
    assert res.status_code == 200
    assert res.data['ok'] is True
    assert res.data['datos']['cover_image_url'] is not None
