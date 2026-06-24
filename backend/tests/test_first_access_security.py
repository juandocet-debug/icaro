import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from modulos.autenticacion.infraestructura.models import ProfileModel
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from django.test import override_settings

User = get_user_model()

@pytest.fixture(autouse=True)
def clear_throttle_cache():
    cache.clear()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_admin():
    return User.objects.create_superuser(username='adminuser', password='password123', email='admin@example.com')

@pytest.fixture
def first_time_user():
    u = User.objects.create_user(username='12345678', password='password123', email='user@test.com')
    perfil, _ = ProfileModel.objects.get_or_create(user=u)
    perfil.cedula = '12345678'
    perfil.must_change_password = True
    perfil.save()
    return u

@pytest.fixture
def normal_user():
    u = User.objects.create_user(username='87654321', password='password123', email='normal@test.com')
    perfil, _ = ProfileModel.objects.get_or_create(user=u)
    perfil.cedula = '87654321'
    perfil.must_change_password = False
    perfil.save()
    return u

@pytest.mark.django_db
def test_first_time_user_has_must_change_password(api_client, test_admin):
    api_client.force_authenticate(user=test_admin)
    res = api_client.post('/api/auth/usuarios/', {
        'cedula': '11223344',
        'first_name': 'Test',
        'last_name': 'User',
        'email': 't@user.com'
    }, format='json')
    assert res.status_code == 201
    
    u = User.objects.get(username='11223344')
    assert u.profile.must_change_password is True
    assert u.profile.cedula == '11223344'

@pytest.mark.django_db
def test_change_password_first_time_without_current(api_client, first_time_user):
    api_client.force_authenticate(user=first_time_user)
    
    # 1. Change password without clave_actual
    res = api_client.post('/api/auth/cambiar-clave/', {
        'nueva_clave': 'newpassword123'
    }, format='json')
    assert res.status_code == 200
    assert res.data['ok'] is True
    assert 'password' not in res.data
    
    first_time_user.refresh_from_db()
    assert first_time_user.profile.must_change_password is False
    assert first_time_user.check_password('newpassword123') is True

@pytest.mark.django_db
def test_normal_change_password_requires_current(api_client, normal_user):
    api_client.force_authenticate(user=normal_user)
    
    # Try changing without clave_actual
    res = api_client.post('/api/auth/cambiar-clave/', {
        'nueva_clave': 'newpassword123'
    }, format='json')
    assert res.status_code == 400
    assert 'La contraseña actual es requerida' in res.data['error']
    
    # Try with incorrect clave_actual
    res = api_client.post('/api/auth/cambiar-clave/', {
        'nueva_clave': 'newpassword123',
        'clave_actual': 'wrongpassword'
    }, format='json')
    assert res.status_code == 400
    assert 'incorrecta' in res.data['error']

    # Try with correct clave_actual
    res = api_client.post('/api/auth/cambiar-clave/', {
        'nueva_clave': 'newpassword123',
        'clave_actual': 'password123'
    }, format='json')
    assert res.status_code == 200
    assert res.data['ok'] is True
    
    # Reject change to same password
    res = api_client.post('/api/auth/cambiar-clave/', {
        'nueva_clave': 'newpassword123',
        'clave_actual': 'newpassword123'
    }, format='json')
    assert res.status_code == 400

@pytest.mark.django_db
def test_password_change_throttling(api_client, normal_user):
    api_client.force_authenticate(user=normal_user)
    
    for i in range(5):
        api_client.post('/api/auth/cambiar-clave/', {
            'nueva_clave': f'passwords{i}',
            'clave_actual': 'password123'
        }, format='json')
        
    res = api_client.post('/api/auth/cambiar-clave/', {
        'nueva_clave': 'passwordfinal',
        'clave_actual': 'password123'
    }, format='json')
    
    assert res.status_code == 429

@pytest.mark.django_db
def test_unauthenticated_request_returns_401(api_client):
    res = api_client.post('/api/auth/cambiar-clave/', {'nueva_clave': 'somepassword'}, format='json')
    assert res.status_code == 401

@pytest.mark.django_db
def test_photo_upload_validations(api_client, normal_user, tmp_path):
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        api_client.force_authenticate(user=normal_user)
        
        # 1. Valid photo upload (200)
        img_data = BytesIO()
        image = Image.new('RGB', (100, 100), color='red')
        image.save(img_data, format='JPEG')
        img_data.seek(0)
        
        file = SimpleUploadedFile("avatar.jpg", img_data.read(), content_type="image/jpeg")
        res = api_client.patch('/api/auth/perfil/foto/', {'foto': file}, format='multipart')
        assert res.status_code == 200
        assert 'photo_url' in res.data
        
        # 2. Fake image with valid mime-type (400)
        fake_file = SimpleUploadedFile("avatar.jpg", b"not-an-image-content", content_type="image/jpeg")
        res = api_client.patch('/api/auth/perfil/foto/', {'foto': fake_file}, format='multipart')
        assert res.status_code == 400
        assert 'inválido o corrupto' in res.data['error']
        
        # 3. Image with resolution > 4096 (400)
        huge_img_data = BytesIO()
        huge_image = Image.new('RGB', (4097, 100), color='blue')
        huge_image.save(huge_img_data, format='JPEG')
        huge_img_data.seek(0)
        
        huge_file = SimpleUploadedFile("huge.jpg", huge_img_data.read(), content_type="image/jpeg")
        res = api_client.patch('/api/auth/perfil/foto/', {'foto': huge_file}, format='multipart')
        assert res.status_code == 400
        assert '4096x4096' in res.data['error']

@pytest.mark.django_db
def test_photo_upload_size_limit(api_client, normal_user, tmp_path):
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        api_client.force_authenticate(user=normal_user)
        
        large_content = b"a" * (5 * 1024 * 1024 + 100)
        large_file = SimpleUploadedFile("large.jpg", large_content, content_type="image/jpeg")
        res = api_client.patch('/api/auth/perfil/foto/', {'foto': large_file}, format='multipart')
        assert res.status_code == 400
        assert 'supera 5MB' in res.data['error']

@pytest.mark.django_db
def test_failed_save_preserves_previous_photo(api_client, normal_user, tmp_path):
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        api_client.force_authenticate(user=normal_user)
        
        # Upload valid photo
        img_data = BytesIO()
        image = Image.new('RGB', (100, 100), color='red')
        image.save(img_data, format='JPEG')
        img_data.seek(0)
        file = SimpleUploadedFile("avatar.jpg", img_data.read(), content_type="image/jpeg")
        res = api_client.patch('/api/auth/perfil/foto/', {'foto': file}, format='multipart')
        assert res.status_code == 200
        
        normal_user.refresh_from_db()
        original_photo_name = normal_user.profile.photo.name
        assert original_photo_name != ""
        
        # Try uploading invalid photo (should fail)
        fake_file = SimpleUploadedFile("avatar2.jpg", b"bad-image-data", content_type="image/jpeg")
        res2 = api_client.patch('/api/auth/perfil/foto/', {'foto': fake_file}, format='multipart')
        assert res2.status_code == 400
        
        normal_user.refresh_from_db()
        assert normal_user.profile.photo.name == original_photo_name
