import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

# Repository and Use Cases
from modulos.organizaciones.infraestructura.DjangoOrganizacionRepository import DjangoOrganizacionRepository
from modulos.organizaciones.aplicacion.CrearOrganizacionUseCase import CrearOrganizacionUseCase

# Models from infrastructure
from modulos.organizaciones.infraestructura.models import OrganizacionModel
from modulos.proyectos.infraestructura.models import ProyectoModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    return User.objects.create_user(username='cruduser', password='password123', is_staff=True)

@pytest.mark.django_db
def test_crear_organizacion_use_case():
    repo = DjangoOrganizacionRepository()
    use_case = CrearOrganizacionUseCase(repo)
    
    org = use_case.ejecutar(nombre="Clean Org", sigla="CO", nit="987654321")
    
    assert org.id is not None
    assert org.nombre == "Clean Org"
    assert org.sigla == "CO"
    assert org.nit == "987654321"
    
    # Verify in DB
    db_org = OrganizacionModel.objects.get(id=org.id)
    assert db_org.nombre == "Clean Org"

@pytest.mark.django_db
def test_proyecto_list_is_paginated(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # Create 22 projects to exceed page size of 20
    projects = [
        ProyectoModel(name=f"Proyecto {i}", created_by=test_user, contract_number=f"C-{i}")
        for i in range(22)
    ]
    ProyectoModel.objects.bulk_create(projects)
    
    # GET list endpoint
    response = api_client.get('/api/proyectos/')
    
    assert response.status_code == 200
    assert 'count' in response.data
    assert 'results' in response.data
    assert response.data['count'] == 22
    assert len(response.data['results']) == 20

@pytest.mark.django_db
def test_proyecto_detail_put_and_delete(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # Setup: Create a project
    proyecto = ProyectoModel.objects.create(
        name="Proyecto Original", created_by=test_user, contract_number="CON-111"
    )
    
    # PUT update
    put_data = {
        "name": "Proyecto Modificado",
        "contract_number": "CON-222",
        "description": "Nueva descripcion"
    }
    response = api_client.put(f'/api/proyectos/{proyecto.id}/', data=put_data, format='json')
    assert response.status_code == 200
    assert response.data['ok'] is True
    assert response.data['datos']['name'] == "Proyecto Modificado"
    assert response.data['datos']['contract_number'] == "CON-222"
    
    # Verify in DB
    proyecto.refresh_from_db()
    assert proyecto.name == "Proyecto Modificado"
    
    # DELETE — requiere superadmin; is_staff recibe 403
    del_response = api_client.delete(f'/api/proyectos/{proyecto.id}/')
    assert del_response.status_code == 403
