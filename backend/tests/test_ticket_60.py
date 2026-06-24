"""
test_ticket_60.py
Ticket 60 — Acceso operativo seguro, proyectos por asignación y fotos de perfil.

Pruebas:
  1. Usuario A asignado a Proyecto A recibe Proyecto A.
  2. Usuario A no recibe Proyecto B (aunque conozca su ID).
  3. Usuario sin asignaciones recibe 200 y lista vacía.
  4. Asignación inactiva no concede acceso al listado.
  5. Retirar al miembro elimina inmediatamente del listado.
  6. Superadministrador recibe todos los proyectos.
  7. Usuario operativo no puede crear proyecto sin proyectos.crear.
  8. GET /api/auth/usuarios/ devuelve foto_url absoluta para perfil con foto.
  9. GET /api/auth/usuarios/ devuelve foto_url: null sin foto.
  10. Usuario sin usuarios.ver recibe 403 (nunca datos de otros).
  11. foto_url nunca contiene rutas de disco del servidor.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from modulos.roles.infraestructura.models import (
    RolModel, PermisoModel, RolPermisoModel, UsuarioRolModel
)
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.autenticacion.aplicacion.CrearUsuarioUseCase import CrearUsuarioUseCase

User = get_user_model()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def crear_usuario(cedula, email):
    uc = CrearUsuarioUseCase()
    return uc.ejecutar(
        cedula=cedula, primer_nombre='Test', segundo_nombre='',
        primer_apellido='User', segundo_apellido='', email=email, telefono='',
    )


def crear_proyecto(name='Proyecto T60'):
    return ProyectoModel.objects.create(name=name)


def crear_rol(codigo, alcance='proyecto'):
    r, _ = RolModel.objects.get_or_create(
        codigo=codigo,
        defaults={'nombre': codigo, 'descripcion': '', 'activo': True,
                  'es_sistema': False, 'tipo_alcance': alcance}
    )
    return r


def asignar(user, proyecto, rol):
    return UsuarioRolModel.objects.create(
        usuario=user, proyecto=proyecto, rol=rol, activo=True
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superadmin():
    return User.objects.create_superuser(
        username='t60_super', email='t60super@icaro.pe', password='Super$123', is_staff=True
    )


@pytest.fixture
def rol_operativo():
    return crear_rol('rol_op_t60', alcance='proyecto')


# ─── 1. Usuario A asignado a Proyecto A lo recibe en el listado ───────────────

@pytest.mark.django_db
def test_usuario_asignado_recibe_su_proyecto(api_client, rol_operativo):
    """Un usuario con asignación activa al proyecto A debe verlo en el listado."""
    user = crear_usuario('60000001', 'asig_a@t60.pe')
    proy_a = crear_proyecto('Proyecto A t60')
    asignar(user, proy_a, rol_operativo)

    api_client.force_authenticate(user=user)
    res = api_client.get('/api/proyectos/')
    assert res.status_code == 200
    ids = [p['id'] for p in res.data['datos']]
    assert str(proy_a.id) in ids, 'El proyecto asignado debe aparecer en el listado'


# ─── 2. Usuario A no recibe Proyecto B ────────────────────────────────────────

@pytest.mark.django_db
def test_usuario_no_recibe_proyecto_sin_asignacion(api_client, rol_operativo):
    """Un usuario NO debe ver un proyecto para el que no tiene asignación activa."""
    user_a = crear_usuario('60000002', 'user_a@t60.pe')
    proy_a = crear_proyecto('Proyecto Propio t60')
    proy_b = crear_proyecto('Proyecto Ajeno t60')

    asignar(user_a, proy_a, rol_operativo)   # asignado solo a A
    # B existe pero user_a no tiene asignación en B

    api_client.force_authenticate(user=user_a)
    res = api_client.get('/api/proyectos/')
    assert res.status_code == 200
    ids = [p['id'] for p in res.data['datos']]
    assert str(proy_b.id) not in ids, 'El proyecto sin asignación no debe aparecer'
    assert str(proy_a.id) in ids, 'El proyecto propio debe aparecer'


# ─── 3. Usuario sin asignaciones recibe 200 y lista vacía ─────────────────────

@pytest.mark.django_db
def test_usuario_sin_asignaciones_recibe_lista_vacia(api_client):
    """Un usuario nuevo sin asignaciones recibe 200 con datos vacíos, nunca proyectos globales."""
    user = crear_usuario('60000003', 'noasig@t60.pe')
    crear_proyecto('Proyecto Publico t60')  # existe pero sin asignación para este user

    api_client.force_authenticate(user=user)
    res = api_client.get('/api/proyectos/')
    assert res.status_code == 200
    assert res.data['datos'] == [], 'Lista vacía para usuario sin asignaciones'
    assert res.data['count'] == 0


# ─── 4. Asignación inactiva no concede acceso ─────────────────────────────────

@pytest.mark.django_db
def test_asignacion_inactiva_no_concede_acceso(api_client, rol_operativo):
    """Una asignación con activo=False no debe incluir el proyecto en el listado."""
    user = crear_usuario('60000004', 'inactiva@t60.pe')
    proy = crear_proyecto('Proyecto Inactivo t60')

    ur = asignar(user, proy, rol_operativo)
    ur.activo = False
    ur.save(update_fields=['activo'])

    api_client.force_authenticate(user=user)
    res = api_client.get('/api/proyectos/')
    assert res.status_code == 200
    ids = [p['id'] for p in res.data['datos']]
    assert str(proy.id) not in ids, 'Asignación inactiva no debe conceder acceso al proyecto'


# ─── 5. Retirar miembro elimina acceso inmediato ─────────────────────────────

@pytest.mark.django_db
def test_retirar_miembro_elimina_acceso_al_listado(api_client, rol_operativo):
    """Tras desactivar la asignación, el proyecto desaparece del listado."""
    user = crear_usuario('60000005', 'retirado@t60.pe')
    proy = crear_proyecto('Proyecto Retiro t60')
    ur = asignar(user, proy, rol_operativo)

    # Verificar que lo veía antes
    api_client.force_authenticate(user=user)
    res_antes = api_client.get('/api/proyectos/')
    ids_antes = [p['id'] for p in res_antes.data['datos']]
    assert str(proy.id) in ids_antes, 'Debe ver el proyecto mientras está asignado'

    # Retirar
    ur.activo = False
    ur.save(update_fields=['activo'])

    # Verificar que ya no lo ve
    res_despues = api_client.get('/api/proyectos/')
    ids_despues = [p['id'] for p in res_despues.data['datos']]
    assert str(proy.id) not in ids_despues, 'Tras retiro, el proyecto no debe aparecer'


# ─── 6. Superadministrador recibe todos los proyectos ─────────────────────────

@pytest.mark.django_db
def test_superadmin_recibe_todos_los_proyectos(api_client, superadmin):
    """El superadministrador ve todos los proyectos sin restricciones."""
    p1 = crear_proyecto('SA Proyecto 1 t60')
    p2 = crear_proyecto('SA Proyecto 2 t60')

    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/proyectos/')
    assert res.status_code == 200
    ids = [p['id'] for p in res.data['datos']]
    assert str(p1.id) in ids
    assert str(p2.id) in ids


# ─── 7. Usuario operativo no puede crear proyecto sin permiso ─────────────────

@pytest.mark.django_db
def test_usuario_operativo_no_puede_crear_proyecto(api_client, rol_operativo):
    """Un usuario sin proyectos.crear recibe 403 al intentar crear."""
    user = crear_usuario('60000006', 'nocrear@t60.pe')
    proy = crear_proyecto('Proyecto Asignado t60')
    asignar(user, proy, rol_operativo)  # rol operativo sin permiso proyectos.crear

    api_client.force_authenticate(user=user)
    res = api_client.post('/api/proyectos/', {'name': 'Nuevo Ilegal'}, format='json')
    assert res.status_code == 403, f'Se esperaba 403, obtuvo {res.status_code}'


# ─── 8. GET usuarios/ devuelve foto_url absoluta si existe foto ───────────────

@pytest.mark.django_db
def test_usuarios_devuelve_foto_url_absoluta_con_foto(api_client, superadmin, tmp_path):
    """Si el perfil tiene foto, foto_url debe ser una URL absoluta válida."""
    from django.core.files.uploadedfile import SimpleUploadedFile
    user = crear_usuario('60000007', 'confoto@t60.pe')

    # Crear una imagen PNG mínima (1x1 rojo)
    png_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0c'
        b'IDAT\x08\xd7c\xf8\xcf\xc0\x00\x00\x00\x02\x00\x01\xe2!'
        b'\xbc3\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    foto = SimpleUploadedFile('foto_test.png', png_data, content_type='image/png')
    perfil = user.profile
    perfil.photo = foto
    perfil.save(update_fields=['photo'])

    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/auth/usuarios/')
    assert res.status_code == 200

    datos = res.data['datos']
    usuario_dato = next((d for d in datos if d['username'] == user.username), None)
    assert usuario_dato is not None, 'El usuario debe aparecer en el listado'
    assert usuario_dato['foto_url'] is not None, 'foto_url debe estar presente'
    assert usuario_dato['foto_url'].startswith('http'), (
        f'foto_url debe ser URL absoluta, obtuvo: {usuario_dato["foto_url"]}'
    )
    assert '\\' not in usuario_dato['foto_url'], 'No debe contener backslashes de ruta de disco'
    assert 'MEDIA_ROOT' not in usuario_dato['foto_url'], 'No debe exponer MEDIA_ROOT'
    assert 'file://' not in usuario_dato['foto_url'], 'No debe ser file:// URI'


# ─── 9. GET usuarios/ devuelve foto_url: null sin foto ───────────────────────

@pytest.mark.django_db
def test_usuarios_devuelve_foto_url_null_sin_foto(api_client, superadmin):
    """Si el perfil no tiene foto, foto_url debe ser null."""
    user = crear_usuario('60000008', 'sinfoto@t60.pe')
    # No asignar foto

    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/auth/usuarios/')
    assert res.status_code == 200

    datos = res.data['datos']
    usuario_dato = next((d for d in datos if d['username'] == user.username), None)
    assert usuario_dato is not None
    assert usuario_dato['foto_url'] is None, 'Sin foto, foto_url debe ser null'


# ─── 10. Usuario sin usuarios.ver recibe 403 ─────────────────────────────────

@pytest.mark.django_db
def test_usuarios_sin_permiso_ver_recibe_403(api_client, rol_operativo):
    """Un usuario sin usuarios.ver no obtiene datos de otros usuarios."""
    user = crear_usuario('60000009', 'nover@t60.pe')

    api_client.force_authenticate(user=user)
    res = api_client.get('/api/auth/usuarios/')
    assert res.status_code == 403, (
        f'Se esperaba 403, obtuvo {res.status_code}. No debe exponer datos de usuarios.'
    )


# ─── 11. foto_url nunca contiene rutas de disco ───────────────────────────────

@pytest.mark.django_db
def test_foto_url_no_contiene_ruta_de_disco(api_client, superadmin, tmp_path):
    """foto_url no debe contener rutas de sistema de archivos del servidor."""
    from django.core.files.uploadedfile import SimpleUploadedFile
    user = crear_usuario('60000010', 'diskpath@t60.pe')

    png_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0c'
        b'IDAT\x08\xd7c\xf8\xcf\xc0\x00\x00\x00\x02\x00\x01\xe2!'
        b'\xbc3\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    foto = SimpleUploadedFile('ruta_test.png', png_data, content_type='image/png')
    perfil = user.profile
    perfil.photo = foto
    perfil.save(update_fields=['photo'])

    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/auth/usuarios/')
    assert res.status_code == 200

    datos = res.data['datos']
    usuario_dato = next((d for d in datos if d['username'] == user.username), None)
    foto_url = usuario_dato.get('foto_url', '')
    if foto_url:
        import re
        # No debe empezar con ruta de disco Windows o Unix
        assert not re.match(r'^[A-Z]:\\|^/home|^/var|^/tmp', foto_url), (
            f'foto_url expone ruta de disco: {foto_url}'
        )
        # Debe ser una URL HTTP
        assert foto_url.startswith('http'), f'foto_url debe ser HTTP, obtuvo: {foto_url}'
