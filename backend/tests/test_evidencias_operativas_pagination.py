import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from modulos.acciones.infraestructura.models import AccionModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.evidencias.infraestructura.models import EvidenciaActividadModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.proyectos.infraestructura.models import ProyectoModel


@pytest.mark.django_db
def test_evidencias_operativas_general_is_paginated():
    client = APIClient()
    user = User.objects.create_superuser(username='pager', password='pass')
    proyecto = ProyectoModel.objects.create(name='Paginado', created_by=user)
    meta = MetaModel.objects.create(proyecto=proyecto, nombre='Meta', created_by=user)
    comp = ComponenteModel.objects.create(project=proyecto, meta=meta, name='Comp')
    accion = AccionModel.objects.create(component=comp, name='Accion')

    EvidenciaActividadModel.objects.bulk_create([
        EvidenciaActividadModel(
            accion=accion,
            creada_por=user,
            nombre=f'Evidencia {i:02d}',
            estado='enviada',
        )
        for i in range(55)
    ])

    client.force_authenticate(user=user)
    url = f'/api/evidencias/proyecto/{proyecto.id}/evidencias-operativas-general/'
    response = client.get(url, {'page': 2, 'page_size': 20, 'estado': 'enviada'})

    assert response.status_code == 200
    assert response.data['count'] == 55
    assert response.data['page'] == 2
    assert response.data['page_size'] == 20
    assert len(response.data['datos']) == 20
    assert response.data['next'] is not None
    assert response.data['previous'] is not None


@pytest.mark.django_db
def test_evidencias_operativas_general_summary_is_compact():
    client = APIClient()
    user = User.objects.create_superuser(username='summary', password='pass')
    proyecto = ProyectoModel.objects.create(name='Resumen', created_by=user)
    meta = MetaModel.objects.create(proyecto=proyecto, nombre='Meta', created_by=user)
    comp = ComponenteModel.objects.create(project=proyecto, meta=meta, name='Comp')
    accion = AccionModel.objects.create(component=comp, name='Accion')

    for estado in ['aprobada', 'enviada', 'observada', 'reabierta', 'borrador']:
        EvidenciaActividadModel.objects.create(
            accion=accion,
            creada_por=user,
            nombre=f'Evidencia {estado}',
            estado=estado,
        )

    client.force_authenticate(user=user)
    url = f'/api/evidencias/proyecto/{proyecto.id}/evidencias-operativas-general/'
    response = client.get(url, {'summary': '1'})

    assert response.status_code == 200
    assert response.data['datos'] == []
    assert response.data['count'] == 5
    assert response.data['summary']['aprobadas'] == 1
    assert response.data['summary']['revision'] == 1
    assert response.data['summary']['pendientes'] == 3
