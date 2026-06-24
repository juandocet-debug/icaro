import pytest
import uuid
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.notificaciones.infraestructura.models import NotificacionModel

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
def test_user_a_cannot_see_user_b_notifications(api_client, user_a, user_b):
    # Setup: Create notifications for A and B
    NotificacionModel.objects.create(usuario=user_a, mensaje="Notificacion A")
    NotificacionModel.objects.create(usuario=user_b, mensaje="Notificacion B")

    api_client.force_authenticate(user=user_a)
    response = api_client.get('/api/notificaciones/')
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['mensaje'] == "Notificacion A"

@pytest.mark.django_db
def test_user_a_cannot_create_notification_for_user_b(api_client, user_a, user_b):
    api_client.force_authenticate(user=user_a)
    data = {
        "usuario_id": user_b.id,
        "mensaje": "Mensaje malicioso para B"
    }
    response = api_client.post('/api/notificaciones/', data=data, format='json')
    assert response.status_code == 201
    
    # Check that notification was actually created for user A, not user B
    notif_id = response.data['datos']['id']
    notif = NotificacionModel.objects.get(id=notif_id)
    assert notif.usuario == user_a
    assert notif.usuario != user_b

@pytest.mark.django_db
def test_user_a_cannot_mark_user_b_notification_as_read(api_client, user_a, user_b):
    notif_b = NotificacionModel.objects.create(usuario=user_b, mensaje="Notificacion B")
    
    api_client.force_authenticate(user=user_a)
    response = api_client.post(f'/api/notificaciones/{notif_b.id}/read/')
    assert response.status_code == 403
    
    notif_b.refresh_from_db()
    assert not notif_b.leido

@pytest.mark.django_db
def test_admin_can_create_notification_for_another_user(api_client, admin_user, user_b):
    api_client.force_authenticate(user=admin_user)
    data = {
        "usuario_id": user_b.id,
        "mensaje": "Mensaje administrativo para B"
    }
    response = api_client.post('/api/notificaciones/', data=data, format='json')
    assert response.status_code == 201
    
    # Check that notification was created for user B
    notif_id = response.data['datos']['id']
    notif = NotificacionModel.objects.get(id=notif_id)
    assert notif.usuario == user_b

@pytest.mark.django_db
def test_admin_can_mark_another_users_notification_as_read(api_client, admin_user, user_b):
    notif_b = NotificacionModel.objects.create(usuario=user_b, mensaje="Notificacion B")
    
    api_client.force_authenticate(user=admin_user)
    response = api_client.post(f'/api/notificaciones/{notif_b.id}/read/')
    assert response.status_code == 200
    
    notif_b.refresh_from_db()
    assert notif_b.leido

@pytest.mark.django_db
def test_nonexistent_notification_returns_404(api_client, user_a):
    api_client.force_authenticate(user=user_a)
    non_existent_id = uuid.uuid4()
    response = api_client.post(f'/api/notificaciones/{non_existent_id}/read/')
    assert response.status_code == 404

@pytest.mark.django_db
def test_notification_list_is_paginated(api_client, user_a):
    for i in range(15):
        NotificacionModel.objects.create(usuario=user_a, mensaje=f"Notif {i}")
        
    api_client.force_authenticate(user=user_a)
    response = api_client.get('/api/notificaciones/')
    assert response.status_code == 200
    assert 'count' in response.data
    assert 'results' in response.data
