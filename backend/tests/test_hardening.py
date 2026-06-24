import pytest
import os
from unittest.mock import patch
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.db import DatabaseError
from django.test import override_settings


@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='admin_user', password='password123', is_staff=True)

@pytest.fixture
def normal_user():
    return User.objects.create_user(username='normal_user', password='password123')

@pytest.mark.django_db
def test_health_check_in_development(api_client, monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'development')
    response = api_client.get('/health')
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "environment" in data
    assert "database" in data
    assert "storage" in data
    assert "version" in data

@pytest.mark.django_db
def test_health_check_in_production_success(api_client, monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'production')
    response = api_client.get('/health')
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok"}
    assert "environment" not in data
    assert "database" not in data
    assert "storage" not in data
    assert "version" not in data

import logging

@pytest.mark.django_db
def test_health_check_in_production_failure(api_client, monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'production')
    
    # Disable logging to prevent traceback rendering crash on Python 3.14
    logging.disable(logging.CRITICAL)
    try:
        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = DatabaseError("Neon connection timeout")
            response = api_client.get('/health')
            assert response.status_code == 503
            data = response.json()
            assert data == {"status": "error"}
            assert "detail" not in data
    finally:
        logging.disable(logging.NOTSET)

@pytest.mark.django_db
def test_health_check_in_development_failure(api_client, monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'development')
    
    logging.disable(logging.CRITICAL)
    try:
        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = DatabaseError("Neon connection timeout")
            response = api_client.get('/health')
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "error"
            assert "detail" in data
            assert "Neon connection" in data["detail"]
    finally:
        logging.disable(logging.NOTSET)



@pytest.mark.django_db
def test_schema_access_in_development(api_client, monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'development')
    response = api_client.get('/api/schema/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_schema_access_in_production_unauthorized(api_client, monkeypatch, normal_user):
    monkeypatch.setenv('ENVIRONMENT', 'production')
    # Anonymous user
    response = api_client.get('/api/schema/')
    assert response.status_code in [401, 403]
    
    # Normal user
    api_client.force_authenticate(user=normal_user)
    response = api_client.get('/api/schema/')
    assert response.status_code in [401, 403]

@pytest.mark.django_db
def test_schema_access_in_production_authorized_for_admin(api_client, monkeypatch, admin_user):
    monkeypatch.setenv('ENVIRONMENT', 'production')
    api_client.force_authenticate(user=admin_user)
    response = api_client.get('/api/schema/')
    assert response.status_code == 200
