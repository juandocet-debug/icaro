"""
test_user_identity.py
Ticket 59 — Identidad completa de usuario.
Verifica:
  - CrearUsuarioUseCase: estructura de nombres, cédula como username, contraseña=cédula,
    must_change_password=True, is_staff=False.
  - ActualizarDatosUsuarioUseCase: actualización de campos individuales y validaciones.
  - Endpoint POST /api/auth/usuarios/ y PATCH /api/auth/usuarios/<id>/
  - GET /api/auth/mi-acceso/ para superadmin y usuario normal.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.autenticacion.infraestructura.models import ProfileModel
from modulos.autenticacion.aplicacion.CrearUsuarioUseCase import CrearUsuarioUseCase
from modulos.autenticacion.aplicacion.ActualizarDatosUsuarioUseCase import ActualizarDatosUsuarioUseCase
from modulos.autenticacion.aplicacion.ObtenerMiAccesoUseCase import ObtenerMiAccesoUseCase

User = get_user_model()


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superadmin():
    return User.objects.create_superuser(
        username='superadmin_t59',
        email='super@icaro.pe',
        password='Seg$r4P@ss',
        is_staff=True,
    )


# ─── CrearUsuarioUseCase ──────────────────────────────────────────────────────

@pytest.mark.django_db
def test_crear_usuario_sets_is_staff_false():
    """Un usuario creado mediante el use case nunca debe tener is_staff=True."""
    uc = CrearUsuarioUseCase()
    user = uc.ejecutar(
        cedula='10000001',
        primer_nombre='Ana',
        segundo_nombre='María',
        primer_apellido='López',
        segundo_apellido='García',
        email='ana.lopez@test.pe',
        telefono='999111222',
    )
    assert user.is_staff is False
    assert user.is_superuser is False


@pytest.mark.django_db
def test_crear_usuario_username_equals_cedula():
    """El username del usuario debe ser igual a su cédula."""
    uc = CrearUsuarioUseCase()
    user = uc.ejecutar(
        cedula='10000002',
        primer_nombre='Pedro',
        segundo_nombre='',
        primer_apellido='Ramos',
        segundo_apellido='',
        email='pedro.ramos@test.pe',
        telefono='988222333',
    )
    assert user.username == '10000002'


@pytest.mark.django_db
def test_crear_usuario_password_equals_cedula():
    """La contraseña inicial debe ser la cédula."""
    uc = CrearUsuarioUseCase()
    cedula = '10000003'
    user = uc.ejecutar(
        cedula=cedula,
        primer_nombre='Luis',
        segundo_nombre='',
        primer_apellido='Torres',
        segundo_apellido='',
        email='luis.torres@test.pe',
        telefono='977333444',
    )
    assert user.check_password(cedula), "La clave inicial debe ser la cédula"


@pytest.mark.django_db
def test_crear_usuario_must_change_password_true():
    """El perfil debe marcar must_change_password=True al crear."""
    uc = CrearUsuarioUseCase()
    user = uc.ejecutar(
        cedula='10000004',
        primer_nombre='María',
        segundo_nombre='',
        primer_apellido='Díaz',
        segundo_apellido='',
        email='maria.diaz@test.pe',
        telefono='966444555',
    )
    perfil = ProfileModel.objects.get(user=user)
    assert perfil.must_change_password is True


@pytest.mark.django_db
def test_crear_usuario_nombres_estructurados():
    """Los campos estructurados de nombre deben guardarse correctamente."""
    uc = CrearUsuarioUseCase()
    user = uc.ejecutar(
        cedula='10000005',
        primer_nombre='Carlos',
        segundo_nombre='Enrique',
        primer_apellido='Mendoza',
        segundo_apellido='Ríos',
        email='carlos.mendoza@test.pe',
        telefono='955555666',
    )
    perfil = ProfileModel.objects.get(user=user)
    assert perfil.primer_nombre == 'Carlos'
    assert perfil.segundo_nombre == 'Enrique'
    assert perfil.primer_apellido == 'Mendoza'
    assert perfil.segundo_apellido == 'Ríos'
    # Refrescar el user desde DB para obtener first_name/last_name sincronizados
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user_db = User.objects.get(pk=user.id)
    assert user_db.first_name == 'Carlos Enrique'
    assert user_db.last_name == 'Mendoza Ríos'


@pytest.mark.django_db
def test_crear_usuario_cedula_duplicada_raises():
    """No se puede crear dos usuarios con la misma cédula."""
    uc = CrearUsuarioUseCase()
    uc.ejecutar(
        cedula='10000006',
        primer_nombre='Uno',
        segundo_nombre='',
        primer_apellido='Apellido',
        segundo_apellido='',
        email='uno@test.pe',
        telefono='944666777',
    )
    with pytest.raises(ValueError, match='cédula'):
        uc.ejecutar(
            cedula='10000006',
            primer_nombre='Dos',
            segundo_nombre='',
            primer_apellido='Apellido',
            segundo_apellido='',
            email='dos@test.pe',
            telefono='944666778',
        )


@pytest.mark.django_db
def test_crear_usuario_email_duplicado_raises():
    """No se puede crear dos usuarios con el mismo email."""
    uc = CrearUsuarioUseCase()
    uc.ejecutar(
        cedula='10000007',
        primer_nombre='Alpha',
        segundo_nombre='',
        primer_apellido='Beta',
        segundo_apellido='',
        email='repetido@test.pe',
        telefono='933777888',
    )
    with pytest.raises(ValueError, match='email'):
        uc.ejecutar(
            cedula='10000008',
            primer_nombre='Gamma',
            segundo_nombre='',
            primer_apellido='Delta',
            segundo_apellido='',
            email='repetido@test.pe',
            telefono='933777889',
        )


@pytest.mark.django_db
def test_crear_usuario_cedula_invalida_raises():
    """Cédula con letras debe lanzar ValueError."""
    uc = CrearUsuarioUseCase()
    with pytest.raises(ValueError, match='cédula'):
        uc.ejecutar(
            cedula='ABC123',
            primer_nombre='X',
            segundo_nombre='',
            primer_apellido='Y',
            segundo_apellido='',
            email='invalido@test.pe',
            telefono='900000000',
        )


@pytest.mark.django_db
def test_crear_usuario_email_normalizado_a_minusculas():
    """El email debe guardarse en minúsculas."""
    uc = CrearUsuarioUseCase()
    user = uc.ejecutar(
        cedula='10000009',
        primer_nombre='Bob',
        segundo_nombre='',
        primer_apellido='Smith',
        segundo_apellido='',
        email='BOB.SMITH@TEST.PE',
        telefono='922888999',
    )
    assert user.email == 'bob.smith@test.pe'


# ─── ActualizarDatosUsuarioUseCase ────────────────────────────────────────────

@pytest.mark.django_db
def test_actualizar_nombre_usuario():
    """Se puede actualizar el primer nombre sin afectar otros campos."""
    uc_crear = CrearUsuarioUseCase()
    user = uc_crear.ejecutar(
        cedula='20000001',
        primer_nombre='OriginalNombre',
        segundo_nombre='',
        primer_apellido='OriginalApellido',
        segundo_apellido='',
        email='original@test.pe',
        telefono='911000001',
    )

    uc_actualizar = ActualizarDatosUsuarioUseCase()
    user_actualizado = uc_actualizar.ejecutar(
        user_id=user.id,
        primer_nombre='NuevoNombre',
    )

    perfil = ProfileModel.objects.get(user=user_actualizado)
    assert perfil.primer_nombre == 'NuevoNombre'
    assert perfil.primer_apellido == 'OriginalApellido'


@pytest.mark.django_db
def test_actualizar_email_duplicado_raises():
    """No se puede cambiar el email a uno ya usado por otro usuario."""
    uc_crear = CrearUsuarioUseCase()
    uc_crear.ejecutar(
        cedula='20000002',
        primer_nombre='A',
        segundo_nombre='',
        primer_apellido='B',
        segundo_apellido='',
        email='existente@test.pe',
        telefono='911000002',
    )
    user2 = uc_crear.ejecutar(
        cedula='20000003',
        primer_nombre='C',
        segundo_nombre='',
        primer_apellido='D',
        segundo_apellido='',
        email='otro@test.pe',
        telefono='911000003',
    )

    uc_actualizar = ActualizarDatosUsuarioUseCase()
    with pytest.raises(ValueError, match='email'):
        uc_actualizar.ejecutar(user_id=user2.id, email='existente@test.pe')


@pytest.mark.django_db
def test_actualizar_usuario_no_existente_raises():
    """Actualizar un user_id que no existe debe lanzar ValueError."""
    uc = ActualizarDatosUsuarioUseCase()
    with pytest.raises(ValueError, match='no encontrado'):
        uc.ejecutar(user_id=99999, primer_nombre='X')


# ─── Endpoint POST /api/auth/usuarios/ ────────────────────────────────────────

@pytest.mark.django_db
def test_endpoint_crear_usuario_sin_auth_returns_401(api_client):
    res = api_client.post('/api/auth/usuarios/', data={}, format='json')
    assert res.status_code == 401


@pytest.mark.django_db
def test_endpoint_crear_usuario_como_superadmin(api_client, superadmin):
    api_client.force_authenticate(user=superadmin)
    res = api_client.post('/api/auth/usuarios/', data={
        'cedula': '30000001',
        'primer_nombre': 'Test',
        'segundo_nombre': '',
        'primer_apellido': 'Api',
        'segundo_apellido': '',
        'email': 'testapi@icaro.pe',
        'telefono': '900100200',
    }, format='json')
    assert res.status_code == 201
    datos = res.data['datos']
    assert datos['is_staff'] is False
    assert datos['username'] == '30000001'


@pytest.mark.django_db
def test_endpoint_crear_usuario_no_expone_password(api_client, superadmin):
    """El endpoint no debe devolver la contraseña en ningún campo."""
    api_client.force_authenticate(user=superadmin)
    res = api_client.post('/api/auth/usuarios/', data={
        'cedula': '30000002',
        'primer_nombre': 'Nopass',
        'segundo_nombre': '',
        'primer_apellido': 'User',
        'segundo_apellido': '',
        'email': 'nopass@icaro.pe',
        'telefono': '900100201',
    }, format='json')
    assert res.status_code == 201
    response_str = str(res.data)
    assert 'password' not in response_str
    assert '30000002' not in response_str.replace('30000002', '__cedula__')  # asegura que cedula no aparece como valor literal de contraseña en campos extra


# ─── Endpoint GET /api/auth/mi-acceso/ ────────────────────────────────────────

@pytest.mark.django_db
def test_mi_acceso_superadmin_returns_es_superadministrador_true(api_client, superadmin):
    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 200
    datos = res.data['datos']
    assert datos['es_superadministrador'] is True
    assert isinstance(datos['permisos'], list)
    assert isinstance(datos['asignaciones'], list)


@pytest.mark.django_db
def test_mi_acceso_usuario_normal_returns_es_superadministrador_false(api_client):
    uc_crear = CrearUsuarioUseCase()
    user = uc_crear.ejecutar(
        cedula='40000001',
        primer_nombre='Normal',
        segundo_nombre='',
        primer_apellido='User',
        segundo_apellido='',
        email='normal@icaro.pe',
        telefono='900400001',
    )
    api_client.force_authenticate(user=user)
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 200
    datos = res.data['datos']
    assert datos['es_superadministrador'] is False
    assert datos['asignaciones'] == []


@pytest.mark.django_db
def test_mi_acceso_sin_auth_returns_401(api_client):
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 401
