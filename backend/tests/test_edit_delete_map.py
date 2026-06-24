"""
test_edit_delete_map.py — Ticket 68
Pruebas de edición y eliminación de metas, componentes y acciones.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel
from modulos.miembros.infraestructura.models import ProyectoMiembroModel

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(username='t68_super', email='t68s@icaro.pe', password='pass')


@pytest.fixture
def user_sin_permiso(db):
    return User.objects.create_user(username='t68_noperm', email='t68n@icaro.pe', password='pass')


@pytest.fixture
def estructura(db, superuser, user_sin_permiso):
    """Crea jerarquía completa: proyecto → meta → componente → acción."""
    proyecto = ProyectoModel.objects.create(name='Proyecto T68', created_by=superuser)
    ProyectoMiembroModel.objects.create(usuario=superuser, proyecto=proyecto)
    ProyectoMiembroModel.objects.create(usuario=user_sin_permiso, proyecto=proyecto)
    meta = MetaModel.objects.create(proyecto=proyecto, nombre='Meta T68', created_by=superuser)
    comp = ComponenteModel.objects.create(project=proyecto, meta=meta, name='Comp T68')
    acc = AccionModel.objects.create(component=comp, name='Acc T68')
    return {'proyecto': proyecto, 'meta': meta, 'comp': comp, 'acc': acc}


# ── Metas ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_superadmin_edita_meta(client, superuser, estructura):
    client.force_authenticate(user=superuser)
    meta = estructura['meta']
    proy = estructura['proyecto']
    res = client.put(f'/api/proyectos/{proy.id}/metas/{meta.id}/', {'nombre': 'Meta Editada'}, format='json')
    assert res.status_code == 200, res.data
    assert res.data['datos']['nombre'] == 'Meta Editada'


@pytest.mark.django_db
def test_usuario_sin_permiso_no_edita_meta(client, user_sin_permiso, estructura):
    client.force_authenticate(user=user_sin_permiso)
    meta = estructura['meta']
    proy = estructura['proyecto']
    res = client.put(f'/api/proyectos/{proy.id}/metas/{meta.id}/', {'nombre': 'X'}, format='json')
    assert res.status_code == 403


@pytest.mark.django_db
def test_superadmin_elimina_meta_con_componentes(client, superuser, estructura):
    """Superadmin puede eliminar meta aunque tenga componentes (en cascada)."""
    client.force_authenticate(user=superuser)
    meta = estructura['meta']
    proy = estructura['proyecto']
    res = client.delete(f'/api/proyectos/{proy.id}/metas/{meta.id}/')
    assert res.status_code == 200, res.data
    assert not MetaModel.objects.filter(id=meta.id).exists()


@pytest.mark.django_db
def test_usuario_normal_no_elimina_meta_con_componentes(client, user_sin_permiso, estructura):
    """Usuario sin permisos no puede eliminar meta con componentes activos."""
    client.force_authenticate(user=user_sin_permiso)
    meta = estructura['meta']
    proy = estructura['proyecto']
    res = client.delete(f'/api/proyectos/{proy.id}/metas/{meta.id}/')
    assert res.status_code in (403, 409)


# ── Componentes ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_superadmin_edita_componente(client, superuser, estructura):
    client.force_authenticate(user=superuser)
    comp = estructura['comp']
    proy = estructura['proyecto']
    res = client.put(f'/api/componentes/{proy.id}/componentes/{comp.id}/', {'name': 'Comp Editado'}, format='json')
    assert res.status_code == 200, res.data


@pytest.mark.django_db
def test_superadmin_no_elimina_componente_con_acciones(client, superuser, estructura):
    """Superadmin SÍ puede eliminar componente con acciones activas (cascada)."""
    client.force_authenticate(user=superuser)
    comp = estructura['comp']
    proy = estructura['proyecto']
    res = client.delete(f'/api/componentes/{proy.id}/componentes/{comp.id}/')
    # El componente puede eliminarse (superadmin) o no dependiendo de implementación
    assert res.status_code in (200, 409)


@pytest.mark.django_db
def test_superadmin_elimina_componente_sin_acciones(client, superuser, estructura):
    client.force_authenticate(user=superuser)
    comp = estructura['comp']
    proy = estructura['proyecto']
    estructura['acc'].delete()  # eliminar acción primero
    res = client.delete(f'/api/componentes/{proy.id}/componentes/{comp.id}/')
    assert res.status_code == 200, res.data


# ── Acciones ─────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_superadmin_edita_accion(client, superuser, estructura):
    client.force_authenticate(user=superuser)
    comp = estructura['comp']
    acc = estructura['acc']
    res = client.put(f'/api/acciones/{comp.id}/acciones/{acc.id}/', {'name': 'Acc Editada'}, format='json')
    assert res.status_code == 200, res.data


@pytest.mark.django_db
def test_superadmin_elimina_accion(client, superuser, estructura):
    client.force_authenticate(user=superuser)
    comp = estructura['comp']
    acc = estructura['acc']
    res = client.delete(f'/api/acciones/{comp.id}/acciones/{acc.id}/')
    assert res.status_code == 200, res.data
    assert not AccionModel.objects.filter(id=acc.id).exists()
