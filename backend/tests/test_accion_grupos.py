import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.acciones.infraestructura.models import AccionModel, AccionGrupoModel
from modulos.evidencias.infraestructura.models import EvidenciaActividadModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.autenticacion.infraestructura.models import ProfileModel

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def superuser():
    u = User.objects.create_superuser(username='99999999', password='password123', email='super@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.cedula = '99999999'
    profile.save()
    return u

@pytest.fixture
def project(superuser):
    return ProyectoModel.objects.create(name="Proyecto Grupos", created_by=superuser)

@pytest.fixture
def meta(project, superuser):
    return MetaModel.objects.create(proyecto=project, nombre="Meta Grupos", created_by=superuser)

@pytest.fixture
def component(project, meta):
    return ComponenteModel.objects.create(project=project, meta=meta, name="Componente Grupos")

@pytest.fixture
def action_req_groups(component):
    return AccionModel.objects.create(
        component=component,
        name="Acción Con Grupos",
        requiere_grupos=True
    )

@pytest.fixture
def action_no_groups(component):
    return AccionModel.objects.create(
        component=component,
        name="Acción Sin Grupos",
        requiere_grupos=False
    )

@pytest.mark.django_db
def test_create_action_with_groups_field(superuser, component):
    # Verify default is False
    action_def = AccionModel.objects.create(component=component, name="Accion Defecto")
    assert action_def.requiere_grupos is False
    assert action_def.requiere_codigo_doxa is False

    # Verify explicitly True
    action_true = AccionModel.objects.create(
        component=component,
        name="Accion True",
        requiere_grupos=True,
        requiere_codigo_doxa=True,
    )
    assert action_true.requiere_grupos is True
    assert action_true.requiere_codigo_doxa is True


@pytest.mark.django_db
def test_crud_grupos_endpoints(api_client, superuser, action_req_groups):
    api_client.force_authenticate(user=superuser)

    # 1. Create group
    url_list = f'/api/acciones/{action_req_groups.id}/grupos/'
    res = api_client.post(url_list, data={
        'nombre': 'Grupo A',
        'codigo': 'G-A',
        'descripcion': 'Grupo de prueba A'
    }, format='json')
    assert res.status_code == 201
    assert res.data['ok'] is True
    grupo_id = res.data['datos']['id']
    assert res.data['datos']['nombre'] == 'Grupo A'
    assert res.data['datos']['activo'] is True

    # 2. Try creating duplicate active name -> should fail with 400
    res_dup = api_client.post(url_list, data={
        'nombre': 'Grupo A',
        'codigo': 'G-A-dup'
    }, format='json')
    assert res_dup.status_code == 400

    # 3. List groups
    res_list = api_client.get(url_list)
    assert res_list.status_code == 200
    assert len(res_list.data['datos']) == 1
    assert res_list.data['datos'][0]['id'] == grupo_id

    # 4. Patch group (edit details)
    url_detail = f'/api/acciones/{action_req_groups.id}/grupos/{grupo_id}/'
    res_patch = api_client.patch(url_detail, data={
        'nombre': 'Grupo A Modificado',
        'codigo': 'G-A-M'
    }, format='json')
    assert res_patch.status_code == 200
    assert res_patch.data['datos']['nombre'] == 'Grupo A Modificado'
    assert res_patch.data['datos']['codigo'] == 'G-A-M'

    # 5. Delete group (no evidence -> physical delete)
    res_delete = api_client.delete(url_detail)
    assert res_delete.status_code == 200
    assert 'físicamente' in res_delete.data['mensaje']
    assert not AccionGrupoModel.objects.filter(id=grupo_id).exists()


@pytest.mark.django_db
def test_evidencias_requiere_grupos_validation(api_client, superuser, action_req_groups, action_no_groups):
    api_client.force_authenticate(user=superuser)

    # Setup groups
    grupo1 = AccionGrupoModel.objects.create(accion=action_req_groups, nombre="Grupo 1")
    grupo_otra_accion = AccionGrupoModel.objects.create(accion=action_no_groups, nombre="Grupo Otra Accion")

    # 1. Post evidence on action_req_groups without group_id -> should fail
    url_ev_req = f'/api/mis-actividades/{action_req_groups.id}/evidencias-operativas/'
    res = api_client.post(url_ev_req, data={
        'nombre': 'Visita Técnica',
        'descripcion': 'Falta el grupo',
        'cantidad_ejecutada': 1.0
    }, format='json')
    assert res.status_code == 400
    assert 'grupo es obligatorio' in res.data['error']

    # 2. Post evidence with invalid/foreign group_id -> should fail
    res = api_client.post(url_ev_req, data={
        'nombre': 'Visita Técnica',
        'grupo_id': str(grupo_otra_accion.id),
        'cantidad_ejecutada': 1.0
    }, format='json')
    assert res.status_code == 400
    assert 'no pertenece a esta acción' in res.data['error']

    action_req_groups.requiere_codigo_doxa = True
    action_req_groups.save(update_fields=['requiere_codigo_doxa'])

    # 3. If the action requires Codigo Doxa, arbitrary text should fail
    res = api_client.post(url_ev_req, data={
        'nombre': 'Visita TÃ©cnica',
        'grupo_id': str(grupo1.id),
        'cantidad_ejecutada': 1.0,
        'codigo_doxa': 'cualquier cosa',
    }, format='json')
    assert res.status_code == 400
    assert 'Doxa' in res.data['error']

    # 4. Post evidence with correct group and Doxa code -> should succeed
    res = api_client.post(url_ev_req, data={
        'nombre': 'Visita TÃ©cnica',
        'grupo_id': str(grupo1.id),
        'cantidad_ejecutada': 1.0,
        'codigo_doxa': 'tog01c03',
    }, format='json')
    assert res.status_code == 201
    ev_id = res.data['datos']['id']
    assert res.data['datos']['grupo']['id'] == str(grupo1.id)
    assert res.data['datos']['codigo_doxa'] == 'TOG01C03'

    # El código queda reservado globalmente, incluso para otra acción.
    res_dup_global = api_client.post(
        f'/api/mis-actividades/{action_no_groups.id}/evidencias-operativas/',
        data={
            'nombre': 'Clase duplicada',
            'cantidad_ejecutada': 1.0,
            'codigo_doxa': 'tog01c03',
        },
        format='json',
    )
    assert res_dup_global.status_code == 400
    assert 'ya existe en el sistema' in res_dup_global.data['error']

    # 4. Post evidence on action_no_groups without group_id -> should succeed
    url_ev_no_req = f'/api/mis-actividades/{action_no_groups.id}/evidencias-operativas/'
    res = api_client.post(url_ev_no_req, data={
        'nombre': 'Taller Operativo',
        'cantidad_ejecutada': 2.0
    }, format='json')
    assert res.status_code == 201
    assert res.data['datos']['grupo'] is None


@pytest.mark.django_db
def test_logical_delete_when_evidence_exists(api_client, superuser, action_req_groups):
    api_client.force_authenticate(user=superuser)

    grupo = AccionGrupoModel.objects.create(accion=action_req_groups, nombre="Grupo Con Evidencias")
    EvidenciaActividadModel.objects.create(
        accion=action_req_groups,
        creada_por=superuser,
        nombre="Evidencia 1",
        grupo=grupo,
        cantidad_ejecutada=1.0
    )

    url_detail = f'/api/acciones/{action_req_groups.id}/grupos/{grupo.id}/'
    res = api_client.delete(url_detail)
    assert res.status_code == 200
    assert 'desactivado lógicamente' in res.data['mensaje']

    grupo.refresh_from_db()
    assert grupo.activo is False


@pytest.mark.django_db
def test_filtering_and_components_search(api_client, superuser, project, component, action_req_groups, action_no_groups):
    api_client.force_authenticate(user=superuser)

    # Setup groups and evidence
    grupo = AccionGrupoModel.objects.create(accion=action_req_groups, nombre="Grupo Filtro")
    ev1 = EvidenciaActividadModel.objects.create(
        accion=action_req_groups,
        creada_por=superuser,
        nombre="Ev1",
        grupo=grupo,
        cantidad_ejecutada=1.0,
        codigo_doxa='TOG01C03',
    )
    ev2 = EvidenciaActividadModel.objects.create(
        accion=action_no_groups,
        creada_por=superuser,
        nombre="Ev2",
        cantidad_ejecutada=2.0,
        codigo_doxa='TOG01C03',
    )

    # 1. Filter general evidences by group_id
    url_general = f'/api/evidencias/proyecto/{project.id}/evidencias-operativas-general/'
    res = api_client.get(f'{url_general}?grupo_id={grupo.id}')
    assert res.status_code == 200
    assert len(res.data['datos']) == 1
    assert res.data['datos'][0]['id'] == str(ev1.id)
    assert res.data['datos'][0]['codigo_doxa'] == 'TOG01C03'
    assert res.data['datos'][0]['codigo_doxa_etiqueta'] == 'TOG01C03-A*'

    res_todas = api_client.get(url_general)
    etiquetas = {
        item['codigo_doxa_etiqueta']
        for item in res_todas.data['datos']
        if item['codigo_doxa'] == 'TOG01C03'
    }
    assert etiquetas == {'TOG01C03-A*', 'TOG01C03-B*'}

    # 2. Filter actions by requiere_grupos
    url_actions = f'/api/acciones/{component.id}/acciones/'
    res_req = api_client.get(f'{url_actions}?requiere_grupos=true')
    assert res_req.status_code == 200
    assert len(res_req.data['datos']) == 1
    assert res_req.data['datos'][0]['id'] == str(action_req_groups.id)

    # 3. Filter components by con_grupos
    url_comps = f'/api/componentes/{project.id}/componentes/'
    res_comps = api_client.get(f'{url_comps}?con_grupos=true')
    assert res_comps.status_code == 200
    assert len(res_comps.data['datos']) == 1
    assert res_comps.data['datos'][0]['id'] == str(component.id)
