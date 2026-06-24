import pytest
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle

@pytest.fixture(autouse=True)
def setup_throttle_rates_and_clear_cache():
    cache.clear()
    original_rates = SimpleRateThrottle.THROTTLE_RATES
    
    # Copy and override to avoid mutating the original dict in settings
    SimpleRateThrottle.THROTTLE_RATES = original_rates.copy()
    SimpleRateThrottle.THROTTLE_RATES['auth_login'] = '2/min'
    SimpleRateThrottle.THROTTLE_RATES['auth_refresh'] = '2/min'
    
    yield
    
    SimpleRateThrottle.THROTTLE_RATES = original_rates
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    return User.objects.create_user(username='test_user', password='correctpassword')

@pytest.mark.django_db
def test_login_endpoint_rate_limiting(api_client, test_user):
    # 1st request - normal
    response = api_client.post('/api/auth/token/', data={"username": "test_user", "password": "wrongpassword"}, format='json')
    assert response.status_code == 401
    
    # 2nd request - normal
    response = api_client.post('/api/auth/token/', data={"username": "test_user", "password": "wrongpassword"}, format='json')
    assert response.status_code == 401

    # 3rd request - should be rate limited (429)
    response = api_client.post('/api/auth/token/', data={"username": "test_user", "password": "wrongpassword"}, format='json')
    assert response.status_code == 429
    assert response.data['detail'] is not None

@pytest.mark.django_db
def test_refresh_endpoint_rate_limiting(api_client):
    # 1st request
    response = api_client.post('/api/auth/token/refresh/', data={"refresh": "invalidtoken"}, format='json')
    assert response.status_code == 401
    
    # 2nd request
    response = api_client.post('/api/auth/token/refresh/', data={"refresh": "invalidtoken"}, format='json')
    assert response.status_code == 401

    # 3rd request - should be rate limited (429)
    response = api_client.post('/api/auth/token/refresh/', data={"refresh": "invalidtoken"}, format='json')
    assert response.status_code == 429

@pytest.mark.django_db
def test_normal_endpoints_not_blocked_by_auth_throttling(api_client, test_user):
    # 1. Exhaust login rate limit (3 attempts)
    for _ in range(3):
        response = api_client.post('/api/auth/token/', data={"username": "test_user", "password": "wrongpassword"}, format='json')
    assert response.status_code == 429

    # 2. Authenticate the client
    api_client.force_authenticate(user=test_user)

    # 3. Call a normal endpoint (like projects list). It should NOT be blocked by 429.
    response = api_client.get('/api/proyectos/')
    assert response.status_code == 200  # Not rate limited

def test_settings_contain_expected_scopes():
    rf_settings = settings.REST_FRAMEWORK
    assert 'DEFAULT_THROTTLE_RATES' in rf_settings
    assert rf_settings['DEFAULT_THROTTLE_RATES']['auth_login'] == '5/min'
    assert rf_settings['DEFAULT_THROTTLE_RATES']['auth_refresh'] == '20/min'

@pytest.mark.django_db
def test_endpoints_respond_normally_before_limit(api_client, test_user):
    response = api_client.post('/api/auth/token/', data={"username": "test_user", "password": "wrongpassword"}, format='json')
    assert response.status_code == 401

