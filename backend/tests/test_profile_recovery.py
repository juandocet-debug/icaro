import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from modulos.autenticacion.infraestructura.models import ProfileModel


@pytest.mark.django_db
def test_authenticated_legacy_user_recovers_missing_profile():
    """A user created by an older release can still complete first access."""
    user = get_user_model().objects.create_user(
        username='90909090',
        password='90909090',
    )
    ProfileModel.objects.filter(user=user).delete()

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get('/api/auth/perfil/')

    assert response.status_code == 200
    assert response.data['datos']['must_change_password'] is True
    assert response.data['datos']['cedula'] == '90909090'
    assert ProfileModel.objects.filter(user=user).exists()
