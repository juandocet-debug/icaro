"""
test_access_control.py
Ticket 59 — Correcciones de control de acceso.

Prueba:
  1. Usuario con rol publico bloqueado en endpoints autenticados.
  2. Permisos de proyecto NO son permisos globales en mi-acceso.
  3. Usuario sin asignación NO ve menú operativo (permisos vacíos y asignaciones vacías).
  4. Alcance expresado en mi-acceso (permisos tienen {codigo, alcance}).
  5. Superadmin siempre pasa VerificarPermisoUseCase.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.roles.infraestructura.models import (
    RolModel, PermisoModel, RolPermisoModel, UsuarioRolModel
)
from modulos.autenticacion.aplicacion.CrearUsuarioUseCase import CrearUsuarioUseCase
from modulos.autenticacion.aplicacion.ObtenerMiAccesoUseCase import ObtenerMiAccesoUseCase
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase
from modulos.proyectos.infraestructura.models import ProyectoModel

User = get_user_model()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def crear_usuario(cedula, email, telefono='900000000'):
    uc = CrearUsuarioUseCase()
    return uc.ejecutar(
        cedula=cedula,
        primer_nombre='Test',
        segundo_nombre='',
        primer_apellido='User',
        segundo_apellido='',
        email=email,
        telefono=telefono,
    )


def crear_permiso(codigo, modulo='test'):
    p, _ = PermisoModel.objects.get_or_create(
        codigo=codigo,
        defaults={'nombre': codigo, 'modulo': modulo, 'descripcion': ''}
    )
    return p


def crear_rol(codigo, nombre, alcance='proyecto'):
    r, _ = RolModel.objects.get_or_create(
        codigo=codigo,
        defaults={
            'nombre': nombre,
            'descripcion': '',
            'activo': True,
            'es_sistema': False,
            'tipo_alcance': alcance,
        }
    )
    return r


# ─── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superadmin():
    return User.objects.create_superuser(
        username='super_ac_test',
        email='super_ac@icaro.pe',
        password='Sup$r123',
        is_staff=True,
    )


@pytest.fixture
def proyecto():
    return ProyectoModel.objects.create(name='Proyecto AC Test')


# ─── 1. Rol publico no concede acceso a endpoints autenticados ─────────────────

@pytest.mark.django_db
def test_verificar_permiso_con_rol_publico_lanza_permission_error(proyecto):
    """Un usuario con rol tipo_alcance='publico' debe fallar la verificación."""
    user = crear_usuario('80000001', 'pub_user@test.pe')
    permiso = crear_permiso('proj.ver')
    rol_publico = crear_rol('rol_publico_t59', 'Rol Público', alcance='publico')
    RolPermisoModel.objects.get_or_create(rol=rol_publico, permiso=permiso)
    UsuarioRolModel.objects.create(
        usuario=user, rol=rol_publico, proyecto=proyecto, activo=True
    )

    uc = VerificarPermisoUseCase()
    with pytest.raises(PermissionError):
        uc.ejecutar(user.id, 'proj.ver')


@pytest.mark.django_db
def test_verificar_permiso_con_rol_publico_no_otorga_acceso_global(proyecto):
    """Rol público no debe pasar aunque tampoco se pase proyecto_id."""
    user = crear_usuario('80000002', 'pub_global@test.pe')
    permiso = crear_permiso('alguna.accion')
    rol_publico = crear_rol('rol_publico_global_t59', 'Público Global', alcance='publico')
    RolPermisoModel.objects.get_or_create(rol=rol_publico, permiso=permiso)
    UsuarioRolModel.objects.create(
        usuario=user, rol=rol_publico, proyecto=proyecto, activo=True
    )

    uc = VerificarPermisoUseCase()
    with pytest.raises(PermissionError):
        uc.ejecutar(user.id, 'alguna.accion')


# ─── 2. Permisos de proyecto NO aparecen como globales en mi-acceso ─────────────

@pytest.mark.django_db
def test_mi_acceso_permiso_proyecto_tiene_alcance_proyecto(proyecto):
    """Un permiso en un rol de alcance='proyecto' debe aparecer con alcance='proyecto'."""
    user = crear_usuario('80000003', 'proj_perm@test.pe')
    permiso = crear_permiso('proj.editar')
    rol = crear_rol('rol_editor_proy_t59', 'Editor Proyecto', alcance='proyecto')
    RolPermisoModel.objects.get_or_create(rol=rol, permiso=permiso)
    UsuarioRolModel.objects.create(
        usuario=user, rol=rol, proyecto=proyecto, activo=True
    )

    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(user.id)

    permiso_en_perfil = next(
        (p for p in resultado['permisos'] if p['codigo'] == 'proj.editar'), None
    )
    assert permiso_en_perfil is not None, 'El permiso debe estar en el perfil'
    assert permiso_en_perfil['alcance'] == 'proyecto', \
        f'Alcance esperado "proyecto", obtenido "{permiso_en_perfil["alcance"]}"'


@pytest.mark.django_db
def test_mi_acceso_permiso_global_tiene_alcance_global(proyecto):
    """Un permiso en un rol de alcance='global' debe aparecer con alcance='global'."""
    user = crear_usuario('80000004', 'global_perm@test.pe')
    permiso = crear_permiso('usuarios.ver.global.test')
    rol = crear_rol('rol_global_t59', 'Rol Global', alcance='global')
    RolPermisoModel.objects.get_or_create(rol=rol, permiso=permiso)
    UsuarioRolModel.objects.create(
        usuario=user, rol=rol, proyecto=proyecto, activo=True
    )

    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(user.id)

    permiso_en_perfil = next(
        (p for p in resultado['permisos'] if p['codigo'] == 'usuarios.ver.global.test'), None
    )
    assert permiso_en_perfil is not None
    assert permiso_en_perfil['alcance'] == 'global'


# ─── 3. Usuario sin asignación: perfil vacío ────────────────────────────────────

@pytest.mark.django_db
def test_mi_acceso_sin_asignaciones_retorna_permisos_vacios():
    """Usuario nuevo sin roles: permisos y asignaciones vacíos."""
    user = crear_usuario('80000005', 'sin_asig@test.pe')
    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(user.id)
    assert resultado['es_superadministrador'] is False
    assert resultado['permisos'] == []
    assert resultado['asignaciones'] == []


@pytest.mark.django_db
def test_endpoint_mi_acceso_sin_asignaciones(api_client):
    """GET /api/auth/mi-acceso/ para usuario sin asignaciones retorna permisos vacíos."""
    user = crear_usuario('80000006', 'noasig_api@test.pe')
    api_client.force_authenticate(user=user)
    res = api_client.get('/api/auth/mi-acceso/')
    assert res.status_code == 200
    datos = res.data['datos']
    assert datos['es_superadministrador'] is False
    assert datos['permisos'] == []
    assert datos['asignaciones'] == []


# ─── 4. Alcance expresado en cada permiso del perfil ───────────────────────────

@pytest.mark.django_db
def test_mi_acceso_permisos_tienen_estructura_codigo_alcance(proyecto):
    """Los permisos en mi-acceso deben ser objetos {codigo, alcance}."""
    user = crear_usuario('80000007', 'struct_perm@test.pe')
    permiso = crear_permiso('struct.test.perm')
    rol = crear_rol('rol_struct_t59', 'Rol Struct', alcance='proyecto')
    RolPermisoModel.objects.get_or_create(rol=rol, permiso=permiso)
    UsuarioRolModel.objects.create(
        usuario=user, rol=rol, proyecto=proyecto, activo=True
    )

    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(user.id)

    for p in resultado['permisos']:
        assert 'codigo' in p, 'El permiso debe tener campo "codigo"'
        assert 'alcance' in p, 'El permiso debe tener campo "alcance"'
        assert p['alcance'] in ('global', 'proyecto', 'componente', 'accion'), \
            f'Alcance inesperado: {p["alcance"]}'


# ─── 5. Superadmin siempre pasa VerificarPermisoUseCase ────────────────────────

@pytest.mark.django_db
def test_superadmin_pasa_verificar_permiso_sin_asignaciones(superadmin):
    """Superadmin no necesita roles ni asignaciones para pasar VerificarPermisoUseCase."""
    uc = VerificarPermisoUseCase()
    # Sin proyecto_id (acción global)
    assert uc.ejecutar(superadmin.id, 'usuarios.ver') is True


@pytest.mark.django_db
def test_superadmin_pasa_verificar_permiso_con_proyecto(superadmin, proyecto):
    """Superadmin pasa VerificarPermisoUseCase incluso con proyecto_id."""
    uc = VerificarPermisoUseCase()
    assert uc.ejecutar(superadmin.id, 'proj.ver', proyecto_id=str(proyecto.id)) is True


# ─── 6. Rol público excluido de asignaciones en mi-acceso ─────────────────────

@pytest.mark.django_db
def test_mi_acceso_excluye_roles_publicos_de_asignaciones(proyecto):
    """Los roles con tipo_alcance='publico' no deben aparecer en asignaciones ni permisos."""
    user = crear_usuario('80000008', 'pub_exclude@test.pe')
    permiso = crear_permiso('pub.recurso')
    rol_pub = crear_rol('rol_pub_excl_t59', 'Público Excluido', alcance='publico')
    RolPermisoModel.objects.get_or_create(rol=rol_pub, permiso=permiso)
    UsuarioRolModel.objects.create(
        usuario=user, rol=rol_pub, proyecto=proyecto, activo=True
    )

    uc = ObtenerMiAccesoUseCase()
    resultado = uc.ejecutar(user.id)

    assert resultado['asignaciones'] == [], \
        'El rol público no debe aparecer en asignaciones del perfil'
    assert resultado['permisos'] == [], \
        'El permiso de rol público no debe aparecer en el perfil'


# ─── 7. Endpoint /api/auth/usuarios/ bloquea permiso de proyecto (no global) ──

@pytest.mark.django_db
def test_listar_usuarios_con_permiso_proyecto_scope_returns_403(api_client, proyecto):
    """Un permiso 'usuarios.ver' asignado con alcance='proyecto' no es global."""
    user = crear_usuario('80000009', 'proj_scope_user@test.pe')
    permiso = crear_permiso('usuarios.ver')
    rol = crear_rol('rol_uver_proy_t59', 'Ver Usuarios Proyecto', alcance='proyecto')
    RolPermisoModel.objects.get_or_create(rol=rol, permiso=permiso)
    UsuarioRolModel.objects.create(
        usuario=user, rol=rol, proyecto=proyecto, activo=True
    )

    api_client.force_authenticate(user=user)
    res = api_client.get('/api/auth/usuarios/')
    # El endpoint requiere permiso global. Alcance='proyecto' no es suficiente.
    assert res.status_code == 403, \
        f'Se esperaba 403 (permiso de proyecto, no global), obtuvo {res.status_code}'
