from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from modulos.acciones.infraestructura.EvidenciasOperativasController import _get_ev, _s_evidencia
from modulos.acciones.infraestructura.models import AccionModel, AsignacionResponsableAccionModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.evidencias.infraestructura.models import EvidenciaActividadModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.uploads.infraestructura.models import UploadModel


@pytest.fixture
def evidence_context(db):
    manager = User.objects.create_superuser(username='query_manager')
    operator = User.objects.create_user(username='query_operator')
    project = ProyectoModel.objects.create(name='Query project', created_by=manager)
    meta = MetaModel.objects.create(proyecto=project, nombre='Meta', created_by=manager)
    component = ComponenteModel.objects.create(project=project, meta=meta, name='Component')
    action = AccionModel.objects.create(component=component, name='Action')
    AsignacionResponsableAccionModel.objects.create(
        accion=action, usuario=operator, tipo_asignacion='apoyo', activo=True,
    )
    client = APIClient()
    client.force_authenticate(user=operator)
    return client, manager, operator, action


def make_evidence(action, owner, with_supports=True):
    evidence = EvidenciaActividadModel.objects.create(
        accion=action, creada_por=owner, nombre='Classes',
    )
    if with_supports:
        now = timezone.now()
        # Insert in the opposite order to verify the API's chronological order.
        for name, age in [('new.pdf', 0), ('old.pdf', 1)]:
            upload = UploadModel.objects.create(
                action=action, evidencia_actividad=evidence, uploaded_by=owner,
                file_name=name, file_url=f'https://example.com/{name}',
                file_type='application/pdf', file_size=100,
            )
            UploadModel.objects.filter(pk=upload.pk).update(created_at=now - timedelta(days=age))
    return evidence


@pytest.mark.django_db
@pytest.mark.parametrize('with_supports', [True, False])
def test_evidence_list_queries_do_not_grow_per_folder(evidence_context, with_supports):
    client, manager, operator, action = evidence_context
    url = f'/api/mis-actividades/{action.id}/evidencias-operativas/'
    first = make_evidence(action, operator, with_supports)
    make_evidence(action, manager, with_supports)
    with CaptureQueriesContext(connection) as single_queries:
        single = client.get(url)
    assert single.status_code == 200
    assert [row['id'] for row in single.data['datos']] == [str(first.id)]

    for _ in range(24):
        make_evidence(action, operator, with_supports)
    with CaptureQueriesContext(connection) as many_queries:
        many = client.get(url)
    assert many.status_code == 200
    assert len(many.data['datos']) == 25
    assert len(many_queries) == len(single_queries)
    assert len(many_queries) <= 6
    for row in many.data['datos']:
        assert row['creada_por']['id'] == str(operator.id)
        assert [s['file_name'] for s in row['soportes']] == (
            ['old.pdf', 'new.pdf'] if with_supports else []
        )
        for support in row['soportes']:
            assert support['file_url'].startswith('https://example.com/')
            assert support['file_size'] == 100
            assert support['file_type'] == 'application/pdf'

    client.force_authenticate(user=manager)
    response = client.get(url)
    assert response.status_code == 200
    assert len(response.data['datos']) == 26


@pytest.mark.django_db
def test_evidence_detail_keeps_supports_and_owner_permissions(evidence_context):
    client, manager, operator, action = evidence_context
    own = make_evidence(action, operator)
    other = make_evidence(action, manager)
    evidence = _get_ev(own.id, action.id, operator, False)
    with CaptureQueriesContext(connection) as queries:
        data = _s_evidencia(evidence)
    assert [s['file_name'] for s in data['soportes']] == ['old.pdf', 'new.pdf']
    assert len(queries) == 1
    with pytest.raises(PermissionError):
        _get_ev(other.id, action.id, operator, False)
