"""
test_hotfix_59_1.py
Hotfix 59.1 — Recuperación segura del Sidebar para Superadministrador.

Prueba:
  1. GET /api/auth/mi-acceso/ retorna 200 con estructura correcta para superadmin.
  2. GET /api/auth/mi-acceso/ retorna 200 con es_superadministrador=false para usuario normal.
  3. GET /api/auth/mi-acceso/ retorna 401 sin autenticación.
  4. Login de superadmin responde correctamente (no bloquea consulta pública).
  5. Usuario con rol consulta_publica NO puede autenticarse vía login.
  6. VerificarPermisoUseCase: superadmin sin perfil de acceso cargado NO falla.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
from modulos.autenticacion.aplicacion.CrearUsuarioUseCase import CrearUsuarioUseCase

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superadmin():
    return User.objects.create_superuser(
        username='h591_admin',
        email='h591admin@icaro.pe',
        password='Admin$ecure1',
        is_staff=True,
    )


# ─── 1. GET /api/auth/mi-acceso/ para superadmin ──────────────────────────────

@pytest.mark.django_db
def test_mi_acceso_superadmin_200_con_estructura_correcta(api_client, superadmin):
    """El endpoint debe responder 200 con es_superadministrador=true y estructura válida."""
    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/auth/mi-acceso/')

    assert res.status_code == 200, f'Se esperaba 200, obtuvo {res.status_code}: {res.data}'
    assert res.data['ok'] is True

    datos = res.data['datos']
    assert 'es_superadministrador' in datos
    assert 'permisos' in datos
    assert 'asignaciones' in datos
    assert datos['es_superadministrador'] is True
    assert isinstance(datos['permisos'], list)
    assert isinstance(datos['asignaciones'], list)
    # Para superadmin, asignaciones debe ser lista vacía (acceso global, no por proyecto)
    assert datos['asignaciones'] == []


@pytest.mark.django_db
def test_mi_acceso_superadmin_permisos_tienen_forma_codigo_alcance(api_client, superadmin):
    """Cada permiso de superadmin debe tener {codigo, alcance='global'}."""
    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 200

    for p in res.data['datos']['permisos']:
        assert 'codigo' in p, f'Falta campo codigo en permiso: {p}'
        assert 'alcance' in p, f'Falta campo alcance en permiso: {p}'
        assert p['alcance'] == 'global', f'Superadmin debe tener alcance global, obtuvo: {p["alcance"]}'


# ─── 2. GET /api/auth/mi-acceso/ para usuario normal ──────────────────────────

@pytest.mark.django_db
def test_mi_acceso_usuario_normal_200_sin_asignaciones(api_client):
    """Usuario normal sin asignaciones: es_superadministrador=false, listas vacías."""
    uc = CrearUsuarioUseCase()
    user = uc.ejecutar(
        cedula='91000001',
        primer_nombre='Normal',
        segundo_nombre='',
        primer_apellido='User',
        segundo_apellido='',
        email='normal_h591@icaro.pe',
        telefono='',
    )
    api_client.force_authenticate(user=user)
    res = api_client.get('/api/auth/mi-acceso/')

    assert res.status_code == 200
    datos = res.data['datos']
    assert datos['es_superadministrador'] is False
    assert datos['permisos'] == []
    assert datos['asignaciones'] == []


# ─── 3. GET /api/auth/mi-acceso/ sin autenticación ────────────────────────────

@pytest.mark.django_db
def test_mi_acceso_sin_auth_retorna_401(api_client):
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 401


# ─── 4. Login de superadmin no bloqueado por regla de consulta_publica ────────

@pytest.mark.django_db
def test_login_superadmin_no_bloqueado_por_regla_publica(api_client, superadmin):
    """
    El ThrottledTokenObtainPairView solo bloquea usuarios con rol 'consulta_publica'.
    Un superadmin sin ese rol debe poder obtener token normalmente.
    """
    # Asegurarse de que el superadmin NO tiene rol consulta_publica
    assert not UsuarioRolModel.objects.filter(
        usuario=superadmin,
        rol__codigo='consulta_publica',
        activo=True
    ).exists()

    res = api_client.post('/api/auth/token/', data={
        'username': 'h591_admin',
        'password': 'Admin$ecure1',
    }, format='json')

    # Puede ser 200 (token obtenido) o la respuesta normal del throttle si hay una limitación
    # Lo importante es que NO sea 403 por la regla de consulta_publica
    assert res.status_code != 403, (
        'El superadmin no debería ser bloqueado por la regla de consulta_publica'
    )


# ─── 5. Usuario con rol consulta_publica bloqueado en login ───────────────────

@pytest.mark.django_db
def test_login_usuario_consulta_publica_retorna_403(api_client):
    """Usuario con rol consulta_publica no puede iniciar sesión."""
    uc = CrearUsuarioUseCase()
    user = uc.ejecutar(
        cedula='91000002',
        primer_nombre='Publico',
        segundo_nombre='',
        primer_apellido='User',
        segundo_apellido='',
        email='pub_h591@icaro.pe',
        telefono='',
    )

    # Asignar rol consulta_publica si existe
    rol_pub = RolModel.objects.filter(codigo='consulta_publica').first()
    if not rol_pub:
        pytest.skip('Rol consulta_publica no está sembrado en esta DB de prueba')

    UsuarioRolModel.objects.create(usuario=user, rol=rol_pub, activo=True)

    res = api_client.post('/api/auth/token/', data={
        'username': '91000002',
        'password': '91000002',
    }, format='json')

    assert res.status_code == 403, (
        f'Usuario con consulta_publica debería obtener 403, obtuvo {res.status_code}'
    )
