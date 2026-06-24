import pytest
import uuid
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel
from modulos.uploads.infraestructura.models import UploadModel
from modulos.evidencias.infraestructura.models import EvidenciaModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_a():
    return User.objects.create_user(username='user_a', password='password123')

@pytest.fixture
def user_b():
    return User.objects.create_user(username='user_b', password='password123')

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='admin_user', password='password123', is_staff=True)

@pytest.fixture
def project_b(user_b):
    return ProyectoModel.objects.create(name="Proyecto B", created_by=user_b, contract_number="CON-B")

@pytest.fixture
def component_b(project_b, user_b):
    from modulos.metas.infraestructura.models import MetaModel
    meta = MetaModel.objects.create(proyecto=project_b, nombre="Meta B", activo=True, created_by=user_b)
    return ComponenteModel.objects.create(project=project_b, meta=meta, name="Componente B")

@pytest.fixture
def action_b(component_b):
    return AccionModel.objects.create(component=component_b, name="Accion B", total_sessions=5)

@pytest.fixture
def upload_b(action_b, user_b):
    return UploadModel.objects.create(
        action=action_b,
        uploaded_by=user_b,
        file_url="http://example.com/b.pdf",
        file_name="b.pdf",
        status="pendiente"
    )

@pytest.mark.django_db
def test_user_a_cannot_list_components_of_user_b_project(api_client, user_a, project_b):
    api_client.force_authenticate(user=user_a)
    response = api_client.get(f'/api/componentes/{project_b.id}/componentes/')
    assert response.status_code == 403

@pytest.mark.django_db
def test_user_a_cannot_create_component_in_user_b_project(api_client, user_a, project_b):
    api_client.force_authenticate(user=user_a)
    response = api_client.post(f'/api/componentes/{project_b.id}/componentes/', data={"name": "Comp Hack"}, format='json')
    assert response.status_code == 403

@pytest.mark.django_db
def test_user_a_cannot_get_put_delete_component_of_user_b(api_client, user_a, project_b, component_b):
    api_client.force_authenticate(user=user_a)
    
    # GET
    res_get = api_client.get(f'/api/componentes/{project_b.id}/componentes/{component_b.id}/')
    assert res_get.status_code == 403
    
    # PUT
    res_put = api_client.put(f'/api/componentes/{project_b.id}/componentes/{component_b.id}/', data={"name": "Updated Hack"}, format='json')
    assert res_put.status_code == 403
    
    # DELETE
    res_del = api_client.delete(f'/api/componentes/{project_b.id}/componentes/{component_b.id}/')
    assert res_del.status_code == 403

@pytest.mark.django_db
def test_user_a_cannot_list_create_actions_in_user_b_component(api_client, user_a, component_b):
    api_client.force_authenticate(user=user_a)
    
    # List
    res_list = api_client.get(f'/api/acciones/{component_b.id}/acciones/')
    assert res_list.status_code == 403
    
    # Create
    res_create = api_client.post(f'/api/acciones/{component_b.id}/acciones/', data={"name": "Accion Hack"}, format='json')
    assert res_create.status_code == 403

@pytest.mark.django_db
def test_user_a_cannot_get_put_delete_action_of_user_b(api_client, user_a, component_b, action_b):
    api_client.force_authenticate(user=user_a)
    
    # GET
    res_get = api_client.get(f'/api/acciones/{component_b.id}/acciones/{action_b.id}/')
    assert res_get.status_code == 403
    
    # PUT
    res_put = api_client.put(f'/api/acciones/{component_b.id}/acciones/{action_b.id}/', data={"name": "Updated Hack"}, format='json')
    assert res_put.status_code == 403
    
    # DELETE
    res_del = api_client.delete(f'/api/acciones/{component_b.id}/acciones/{action_b.id}/')
    assert res_del.status_code == 403

@pytest.mark.django_db
def test_user_a_cannot_list_create_uploads_in_user_b_action(api_client, user_a, action_b):
    api_client.force_authenticate(user=user_a)
    
    # List
    res_list = api_client.get(f'/api/uploads/{action_b.id}/uploads/')
    assert res_list.status_code == 403
    
    # Create
    res_create = api_client.post(f'/api/uploads/{action_b.id}/uploads/', data={"file_url": "http://hack.com", "file_name": "hack.pdf"}, format='json')
    assert res_create.status_code == 403

@pytest.mark.django_db
def test_user_a_cannot_delete_upload_of_user_b(api_client, user_a, action_b, upload_b):
    api_client.force_authenticate(user=user_a)
    response = api_client.delete(f'/api/uploads/{action_b.id}/uploads/{upload_b.id}/')
    assert response.status_code == 403

@pytest.mark.django_db
def test_user_a_cannot_list_create_evidences_in_user_b_project(api_client, user_a, project_b):
    api_client.force_authenticate(user=user_a)
    
    # List
    res_list = api_client.get(f'/api/evidencias/proyecto/{project_b.id}/')
    assert res_list.status_code == 403
    
    # Create
    res_create = api_client.post(f'/api/evidencias/proyecto/{project_b.id}/', data={"nombre": "Evidencia Hack", "url": "http://hack.com/evidencia.pdf"}, format='json')
    assert res_create.status_code == 403

@pytest.mark.django_db
def test_admin_can_access_child_resources_of_any_project(api_client, admin_user, project_b, component_b, action_b, upload_b):
    api_client.force_authenticate(user=admin_user)
    
    # List components
    res = api_client.get(f'/api/componentes/{project_b.id}/componentes/')
    assert res.status_code == 200
    
    # Get component
    res = api_client.get(f'/api/componentes/{project_b.id}/componentes/{component_b.id}/')
    assert res.status_code == 200
    
    # List actions
    res = api_client.get(f'/api/acciones/{component_b.id}/acciones/')
    assert res.status_code == 200
    
    # Get action
    res = api_client.get(f'/api/acciones/{component_b.id}/acciones/{action_b.id}/')
    assert res.status_code == 200
    
    # List uploads
    res = api_client.get(f'/api/uploads/{action_b.id}/uploads/')
    assert res.status_code == 200

@pytest.mark.django_db
def test_cannot_operate_mismatched_child_parent_ids(api_client, user_b, project_b, component_b, action_b, upload_b):
    api_client.force_authenticate(user=user_b)
    
    # Mismatched component for project
    wrong_project = ProyectoModel.objects.create(name="Otro", created_by=user_b)
    res = api_client.get(f'/api/componentes/{wrong_project.id}/componentes/{component_b.id}/')
    assert res.status_code == 403
    
    # Mismatched action for component
    from modulos.metas.infraestructura.models import MetaModel
    meta_wrong = MetaModel.objects.create(proyecto=project_b, nombre="Meta Wrong", activo=True, created_by=user_b)
    wrong_component = ComponenteModel.objects.create(project=project_b, meta=meta_wrong, name="Wrong")
    res = api_client.get(f'/api/acciones/{wrong_component.id}/acciones/{action_b.id}/')
    assert res.status_code == 403
    
    # Mismatched upload for action
    wrong_action = AccionModel.objects.create(component=component_b, name="Wrong Action")
    res = api_client.delete(f'/api/uploads/{wrong_action.id}/uploads/{upload_b.id}/')
    assert res.status_code == 403
