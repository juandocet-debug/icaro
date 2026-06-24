"""
test_role_based_access.py
Ticket 59 — Control de acceso por rol.
Verifica:
  - ObtenerMiAccesoUseCase: permisos consolidados por rol.
  - El sidebar/acceso refleja los permisos del rol asignado.
  - Un usuario con rol de proyecto solo accede a su propio proyecto.
  - Endpoint PATCH /api/auth/usuarios/<id>/ protegido por permiso.
  - Endpoint GET /api/auth/usuarios/ protegido por permiso usuarios.ver.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.roles.infraestructura.models import (
    RolModel, PermisoModel, RolPermisoModel, UsuarioRolModel
)
from modulos.autenticacion.aplicacion.CrearUsuarioUseCase import CrearUsuarioUseCase
from modulos.autenticacion.aplicacion.ObtenerMiAccesoUseCase import ObtenerMiAccesoUseCase
from modulos.proyectos.infraestructura.models import ProyectoModel

User = get_user_model()


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superadmin():
    return User.objects.create_superuser(
        username='superadmin_rba',
        email='superrba@icaro.pe',
        password='Seg$r4P@ss',
        is_staff=True,
    )


@pytest.fixture
def nuevo_usuario():
    uc = CrearUsuarioUseCase()
    return uc.ejecutar(
        cedula='50000001',
        primer_nombre='Rol',
        segundo_nombre='',
        primer_apellido='Tester',
        segundo_apellido='',
        email='roltester@icaro.pe',
        telefono='900500001',
    )


@pytest.fixture
def proyecto():
    return ProyectoModel.objects.create(name='Proyecto RBA Test')


@pytest.fixture
def permiso_usuarios_ver():
    permiso, _ = PermisoModel.objects.get_or_create(
        codigo='usuarios.ver',
        defaults={'nombre': 'Ver Usuarios', 'descripcion': 'Permite listar usuarios', 'modulo': 'usuarios'}
    )
    return permiso


@pytest.fixture
def rol_con_permiso_ver(permiso_usuarios_ver):
    rol = RolModel.objects.create(
        codigo='rol_ver_usuarios_rba_test',
        nombre='Rol Ver Usuarios RBA',
        descripcion='Solo puede ver usuarios',
        activo=True,
        es_sistema=False,
        tipo_alcance='global',  # global para que usuarios.ver aplique sin proyecto_id
    )
    RolPermisoModel.objects.create(rol=rol, permiso=permiso_usuarios_ver)
    return rol


# ─── ObtenerMiAccesoUseCase ──────────────────────────────────────────────────

@pytest.mark.django_db
def test_obtener_mi_acceso_usuario_sin_roles_tiene_permisos_vacios(nuevo_usuario):
    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(nuevo_usuario.id)
    assert resultado['es_superadministrador'] is False
    assert resultado['asignaciones'] == []
    assert resultado['permisos'] == []


@pytest.mark.django_db
def test_obtener_mi_acceso_superadmin_tiene_todos_permisos(superadmin):
    # Asegurar que hay al menos un permiso en el sistema
    PermisoModel.objects.get_or_create(
        codigo='proj.ver',
        defaults={'nombre': 'Ver Proyectos', 'descripcion': '-', 'modulo': 'proyectos'}
    )
    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(superadmin.id)
    assert resultado['es_superadministrador'] is True
    assert len(resultado['permisos']) > 0
    assert resultado['asignaciones'] == []


@pytest.mark.django_db
def test_obtener_mi_acceso_usuario_con_rol_asignado_recibe_permisos(
    nuevo_usuario, proyecto, rol_con_permiso_ver
):
    """Asignar un rol con 'usuarios.ver' al usuario debe reflejarse en mi-acceso."""
    UsuarioRolModel.objects.create(
        usuario=nuevo_usuario,
        rol=rol_con_permiso_ver,
        proyecto=proyecto,
        activo=True,
    )
    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(nuevo_usuario.id)

    assert resultado['es_superadministrador'] is False
    assert len(resultado['asignaciones']) == 1
    assert resultado['asignaciones'][0]['rol_codigo'] == rol_con_permiso_ver.codigo
    # Los permisos ahora son {codigo, alcance}
    codigos = [p['codigo'] for p in resultado['permisos']]
    assert 'usuarios.ver' in codigos


@pytest.mark.django_db
def test_obtener_mi_acceso_rol_inactivo_no_suma_permisos(
    nuevo_usuario, proyecto, rol_con_permiso_ver
):
    """Un UsuarioRolModel con activo=False no debe sumar permisos."""
    UsuarioRolModel.objects.create(
        usuario=nuevo_usuario,
        rol=rol_con_permiso_ver,
        proyecto=proyecto,
        activo=False,   # inactivo
    )
    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(nuevo_usuario.id)
    assert resultado['permisos'] == []
    assert resultado['asignaciones'] == []


# ─── Endpoints protegidos por rol ────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_usuarios_sin_permiso_returns_403(api_client, nuevo_usuario):
    """GET /api/auth/usuarios/ sin 'usuarios.ver' debe retornar 403."""
    api_client.force_authenticate(user=nuevo_usuario)
    res = api_client.get('/api/auth/usuarios/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_listar_usuarios_con_permiso_returns_200(
    api_client, nuevo_usuario, proyecto, rol_con_permiso_ver
):
    """GET /api/auth/usuarios/ con 'usuarios.ver' debe retornar 200."""
    UsuarioRolModel.objects.create(
        usuario=nuevo_usuario,
        rol=rol_con_permiso_ver,
        proyecto=proyecto,
        activo=True,
    )
    # El VerificarPermisoUseCase consulta por codigo del permiso en RolPermisoModel.
    # Verificamos que el permiso fue correctamente asignado al rol.
    from modulos.roles.infraestructura.models import RolPermisoModel
    assert RolPermisoModel.objects.filter(
        rol=rol_con_permiso_ver,
        permiso__codigo='usuarios.ver'
    ).exists(), 'El permiso usuarios.ver debe estar asignado al rol'

    api_client.force_authenticate(user=nuevo_usuario)
    res = api_client.get('/api/auth/usuarios/')
    assert res.status_code == 200, f'Se esperaba 200, se obtuvo {res.status_code}: {res.data}'
    assert res.data['ok'] is True


@pytest.mark.django_db
def test_crear_usuario_sin_permiso_returns_403(api_client, nuevo_usuario):
    """POST /api/auth/usuarios/ sin 'usuarios.crear' debe retornar 403."""
    api_client.force_authenticate(user=nuevo_usuario)
    res = api_client.post('/api/auth/usuarios/', data={
        'cedula': '60000001',
        'primer_nombre': 'Intento',
        'primer_apellido': 'Fallido',
        'email': 'intento@icaro.pe',
        'telefono': '900600001',
    }, format='json')
    assert res.status_code == 403


@pytest.mark.django_db
def test_patch_usuario_sin_permiso_returns_403(api_client, nuevo_usuario, superadmin):
    """PATCH /api/auth/usuarios/<id>/ sin 'usuarios.editar' debe retornar 403."""
    api_client.force_authenticate(user=nuevo_usuario)
    res = api_client.patch(
        f'/api/auth/usuarios/{superadmin.id}/',
        data={'primer_nombre': 'Hack'},
        format='json'
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_superadmin_puede_crear_y_listar_usuarios(api_client, superadmin):
    """El superadmin siempre puede crear y listar usuarios."""
    api_client.force_authenticate(user=superadmin)

    res_get = api_client.get('/api/auth/usuarios/')
    assert res_get.status_code == 200

    res_post = api_client.post('/api/auth/usuarios/', data={
        'cedula': '70000001',
        'primer_nombre': 'Super',
        'segundo_nombre': '',
        'primer_apellido': 'Create',
        'segundo_apellido': '',
        'email': 'supercreate@icaro.pe',
        'telefono': '900700001',
    }, format='json')
    assert res_post.status_code == 201


# ─── Endpoint mi-acceso ───────────────────────────────────────────────────────

@pytest.mark.django_db
def test_mi_acceso_refleja_rol_activo(
    api_client, nuevo_usuario, proyecto, rol_con_permiso_ver
):
    UsuarioRolModel.objects.create(
        usuario=nuevo_usuario,
        rol=rol_con_permiso_ver,
        proyecto=proyecto,
        activo=True,
    )
    api_client.force_authenticate(user=nuevo_usuario)
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 200
    datos = res.data['datos']
    assert datos['es_superadministrador'] is False
    assert len(datos['asignaciones']) == 1
    assert str(proyecto.id) in datos['asignaciones'][0]['proyecto_id']
    # Los permisos son [{codigo, alcance}]
    codigos = [p['codigo'] for p in datos['permisos']]
    assert 'usuarios.ver' in codigos


@pytest.mark.django_db
def test_mi_acceso_no_incluye_roles_inactivos(
    api_client, nuevo_usuario, proyecto, rol_con_permiso_ver
):
    UsuarioRolModel.objects.create(
        usuario=nuevo_usuario,
        rol=rol_con_permiso_ver,
        proyecto=proyecto,
        activo=False,
    )
    api_client.force_authenticate(user=nuevo_usuario)
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 200
    datos = res.data['datos']
    assert datos['asignaciones'] == []
    assert datos['permisos'] == []
