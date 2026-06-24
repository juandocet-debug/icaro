"""
test_hotfix_60_1.py
Hotfix 60.1 — Acceso al detalle de proyecto por asignación activa (UsuarioRolModel).

Pruebas:
  1. Usuario asignado a Proyecto A (creado por otra persona) recibe 200 en GET /api/proyectos/A/.
  2. Usuario con asignación INACTIVA al proyecto recibe 403.
  3. Usuario SIN asignación al proyecto recibe 403.
  4. Superadministrador accede a cualquier proyecto sin importar creador.
  5. Propietario-creador sin asignación activa ya NO puede acceder al detalle.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.autenticacion.aplicacion.CrearUsuarioUseCase import CrearUsuarioUseCase

User = get_user_model()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def crear_usuario(cedula, email):
    return CrearUsuarioUseCase().ejecutar(
        cedula=cedula, primer_nombre='Test', segundo_nombre='',
        primer_apellido='User', segundo_apellido='', email=email, telefono='',
    )


def crear_proyecto(creador=None, name='Proyecto h60_1'):
    kwargs = {'name': name}
    if creador:
        kwargs['created_by'] = creador
    return ProyectoModel.objects.create(**kwargs)


def crear_rol():
    r, _ = RolModel.objects.get_or_create(
        codigo='rol_h60_1',
        defaults={'nombre': 'Rol h60.1', 'descripcion': '', 'activo': True,
                  'es_sistema': False, 'tipo_alcance': 'proyecto'}
    )
    return r


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superadmin():
    return User.objects.create_superuser(
        username='h601_super', email='h601super@icaro.pe',
        password='Super$123', is_staff=True,
    )


@pytest.fixture
def rol():
    return crear_rol()


# ─── 1. Asignado al proyecto de otro: 200 ─────────────────────────────────────

@pytest.mark.django_db
def test_usuario_asignado_ve_detalle_de_proyecto_ajeno(api_client, rol):
    """
    Usuario asignado a Proyecto A (creado por usuario_b) debe recibir 200.
    La autorización es por UsuarioRolModel activo, no por created_by_id.
    """
    otro_creador = User.objects.create_user(username='creador_h601', password='pass')
    usuario_asignado = crear_usuario('70100001', 'asig_h601@t.pe')

    proyecto = crear_proyecto(creador=otro_creador, name='Proyecto Ajeno h60_1')
    UsuarioRolModel.objects.create(
        usuario=usuario_asignado, proyecto=proyecto, rol=rol, activo=True
    )

    api_client.force_authenticate(user=usuario_asignado)
    res = api_client.get(f'/api/proyectos/{proyecto.id}/')

    assert res.status_code == 200, (
        f'Se esperaba 200 para usuario asignado, obtuvo {res.status_code}: {res.data}'
    )
    assert res.data['datos']['id'] == str(proyecto.id)


# ─── 2. Asignación inactiva → 403 ────────────────────────────────────────────

@pytest.mark.django_db
def test_asignacion_inactiva_no_da_acceso_al_detalle(api_client, rol):
    """Una asignación desactivada no debe conceder acceso al detalle."""
    creador = User.objects.create_user(username='creador_h601_b', password='pass')
    usuario = crear_usuario('70100002', 'inactiva_h601@t.pe')
    proyecto = crear_proyecto(creador=creador, name='Proyecto Inactivo h60_1')

    ur = UsuarioRolModel.objects.create(
        usuario=usuario, proyecto=proyecto, rol=rol, activo=True
    )
    # Desactivar
    ur.activo = False
    ur.save(update_fields=['activo'])

    api_client.force_authenticate(user=usuario)
    res = api_client.get(f'/api/proyectos/{proyecto.id}/')

    assert res.status_code in (403, 404), (
        f'Asignación inactiva debería dar 403/404, obtuvo {res.status_code}'
    )


# ─── 3. Sin asignación → 403 ─────────────────────────────────────────────────

@pytest.mark.django_db
def test_sin_asignacion_no_da_acceso_al_detalle(api_client):
    """Usuario sin ninguna asignación al proyecto no puede ver su detalle."""
    creador = User.objects.create_user(username='creador_h601_c', password='pass')
    usuario = crear_usuario('70100003', 'noasig_h601@t.pe')
    proyecto = crear_proyecto(creador=creador, name='Proyecto Sin Asig h60_1')
    # No se crea UsuarioRolModel para usuario

    api_client.force_authenticate(user=usuario)
    res = api_client.get(f'/api/proyectos/{proyecto.id}/')

    assert res.status_code in (403, 404), (
        f'Sin asignación debería dar 403/404, obtuvo {res.status_code}'
    )


# ─── 4. Superadministrador accede a cualquier proyecto ────────────────────────

@pytest.mark.django_db
def test_superadmin_accede_a_cualquier_proyecto(api_client, superadmin):
    """El superadministrador puede ver el detalle de cualquier proyecto."""
    otro = User.objects.create_user(username='otro_creador_h601', password='pass')
    proyecto = crear_proyecto(creador=otro, name='Proyecto Cualquiera h60_1')

    api_client.force_authenticate(user=superadmin)
    res = api_client.get(f'/api/proyectos/{proyecto.id}/')

    assert res.status_code == 200, (
        f'Superadmin debe ver cualquier proyecto, obtuvo {res.status_code}'
    )
    assert res.data['datos']['id'] == str(proyecto.id)


# ─── 5. Creador sin asignación ya NO puede acceder al detalle ─────────────────

@pytest.mark.django_db
def test_creador_sin_asignacion_activa_no_accede_al_detalle(api_client):
    """
    Política nueva: created_by_id NO concede acceso al detalle.
    El creador debe tener también una asignación activa para acceder.
    """
    creador = crear_usuario('70100004', 'creador_solo_h601@t.pe')
    proyecto = crear_proyecto(creador=creador, name='Proyecto Creador h60_1')
    # Creador existe, pero sin asignación activa en UsuarioRolModel

    api_client.force_authenticate(user=creador)
    res = api_client.get(f'/api/proyectos/{proyecto.id}/')

    assert res.status_code in (403, 404), (
        f'Creador sin asignación activa debería recibir 403/404, obtuvo {res.status_code}'
    )


# ─── 6. Creador CON asignación activa sí accede ───────────────────────────────

@pytest.mark.django_db
def test_creador_con_asignacion_activa_accede_al_detalle(api_client, rol):
    """Creador que también tiene asignación activa puede acceder al detalle."""
    creador = crear_usuario('70100005', 'creador_asig_h601@t.pe')
    proyecto = crear_proyecto(creador=creador, name='Proyecto Creador Asig h60_1')
    UsuarioRolModel.objects.create(
        usuario=creador, proyecto=proyecto, rol=rol, activo=True
    )

    api_client.force_authenticate(user=creador)
    res = api_client.get(f'/api/proyectos/{proyecto.id}/')

    assert res.status_code == 200, (
        f'Creador con asignación activa debe recibir 200, obtuvo {res.status_code}'
    )
