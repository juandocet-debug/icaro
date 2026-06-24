import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from modulos.acciones.infraestructura.models import AccionModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.proyectos.infraestructura.models import ProyectoModel


User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def superadmin(db):
    return User.objects.create_superuser(username='delete_superadmin', password='pass12345')


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(username='delete_staff', password='pass12345', is_staff=True)


@pytest.fixture
def estructura(superadmin):
    proyecto = ProyectoModel.objects.create(name='Proyecto para borrar', created_by=superadmin)
    meta = MetaModel.objects.create(proyecto=proyecto, nombre='Meta para borrar', created_by=superadmin)
    componente = ComponenteModel.objects.create(project=proyecto, meta=meta, name='Componente para borrar')
    accion = AccionModel.objects.create(component=componente, name='Accion para borrar')
    return proyecto, meta, componente, accion


@pytest.mark.django_db
def test_solo_superadmin_puede_eliminar_proyecto(client, superadmin, staff_user, estructura):
    proyecto, _, _, _ = estructura
    client.force_authenticate(user=staff_user)
    denied = client.delete(f'/api/proyectos/{proyecto.id}/')
    assert denied.status_code == 403
    assert ProyectoModel.objects.filter(id=proyecto.id).exists()

    client.force_authenticate(user=superadmin)
    allowed = client.delete(f'/api/proyectos/{proyecto.id}/')
    assert allowed.status_code == 200
    assert not ProyectoModel.objects.filter(id=proyecto.id).exists()


@pytest.mark.django_db
def test_solo_superadmin_puede_eliminar_meta_y_su_estructura(client, superadmin, staff_user, estructura):
    proyecto, meta, componente, accion = estructura
    client.force_authenticate(user=staff_user)
    denied = client.delete(f'/api/proyectos/{proyecto.id}/metas/{meta.id}/')
    assert denied.status_code == 403
    assert MetaModel.objects.filter(id=meta.id).exists()

    client.force_authenticate(user=superadmin)
    allowed = client.delete(f'/api/proyectos/{proyecto.id}/metas/{meta.id}/')
    assert allowed.status_code == 200
    assert not MetaModel.objects.filter(id=meta.id).exists()
    assert not ComponenteModel.objects.filter(id=componente.id).exists()
    assert not AccionModel.objects.filter(id=accion.id).exists()
