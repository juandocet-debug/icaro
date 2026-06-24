import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.proyectos.infraestructura.models import ProyectoModel

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

@pytest.mark.django_db
def test_user_a_cannot_see_user_b_projects_in_list(api_client, user_a, user_b):
    """
    Política nueva: el listado filtra por UsuarioRolModel activo, no por created_by_id.
    Un usuario que creó un proyecto pero no tiene asignación activa en él,
    NO lo verá en el listado (principio de fuente única de verdad).
    Un usuario nunca ve proyectos de otro usuario.
    """
    from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
    from modulos.proyectos.infraestructura.models import ProyectoModel as PM

    proj_a = PM.objects.create(name="Proyecto A", created_by=user_a, contract_number="A-1")
    PM.objects.create(name="Proyecto B", created_by=user_b, contract_number="B-1")

    # Sin asignación activa, user_a no ve ningún proyecto
    api_client.force_authenticate(user=user_a)
    res_sin_asig = api_client.get('/api/proyectos/')
    assert res_sin_asig.status_code == 200
    assert res_sin_asig.data['count'] == 0, (
        'Sin asignación activa, el listado debe estar vacío aunque sea creador'
    )

    # Con asignación activa en Proyecto A, lo ve; Proyecto B sigue oculto
    rol, _ = RolModel.objects.get_or_create(
        codigo='rol_test_obj_perm',
        defaults={'nombre': 'Test', 'descripcion': '', 'activo': True,
                  'es_sistema': False, 'tipo_alcance': 'proyecto'}
    )
    UsuarioRolModel.objects.create(usuario=user_a, proyecto=proj_a, rol=rol, activo=True)

    res_con_asig = api_client.get('/api/proyectos/')
    assert res_con_asig.status_code == 200
    assert res_con_asig.data['count'] == 1
    assert res_con_asig.data['results'][0]['name'] == "Proyecto A"


@pytest.mark.django_db
def test_user_a_cannot_get_user_b_project(api_client, user_a, user_b):
    proj_b = ProyectoModel.objects.create(name="Proyecto B", created_by=user_b, contract_number="B-1")
    
    # Authenticate as User A
    api_client.force_authenticate(user=user_a)
    response = api_client.get(f'/api/proyectos/{proj_b.id}/')
    
    # Expect 403 or 404
    assert response.status_code in [403, 404]

@pytest.mark.django_db
def test_user_a_cannot_put_user_b_project(api_client, user_a, user_b):
    proj_b = ProyectoModel.objects.create(name="Proyecto B", created_by=user_b, contract_number="B-1")
    
    # Authenticate as User A
    api_client.force_authenticate(user=user_a)
    put_data = {"name": "Hackeado por A"}
    response = api_client.put(f'/api/proyectos/{proj_b.id}/', data=put_data, format='json')
    
    # Expect 403 or 404
    assert response.status_code in [403, 404]
    # Verify DB was NOT changed
    proj_b.refresh_from_db()
    assert proj_b.name == "Proyecto B"

@pytest.mark.django_db
def test_user_a_cannot_delete_user_b_project(api_client, user_a, user_b):
    proj_b = ProyectoModel.objects.create(name="Proyecto B", created_by=user_b, contract_number="B-1")
    
    # Authenticate as User A
    api_client.force_authenticate(user=user_a)
    response = api_client.delete(f'/api/proyectos/{proj_b.id}/')
    
    # Expect 403 or 404
    assert response.status_code in [403, 404]
    # Verify DB entry still exists
    assert ProyectoModel.objects.filter(id=proj_b.id).exists()

@pytest.mark.django_db
def test_admin_can_access_any_project(api_client, admin_user, user_a):
    proj_a = ProyectoModel.objects.create(name="Proyecto A", created_by=user_a, contract_number="A-1")
    
    # Authenticate as Admin
    api_client.force_authenticate(user=admin_user)
    
    # Admin lists projects (sees all)
    list_response = api_client.get('/api/proyectos/')
    assert list_response.status_code == 200
    assert list_response.data['count'] == 1
    
    # Admin gets project A
    get_response = api_client.get(f'/api/proyectos/{proj_a.id}/')
    assert get_response.status_code == 200
    
    # Admin updates project A
    put_response = api_client.put(f'/api/proyectos/{proj_a.id}/', data={"name": "Actualizado por Admin"}, format='json')
    assert put_response.status_code == 200
    
    # Admin deletes project A
    del_response = api_client.delete(f'/api/proyectos/{proj_a.id}/')
    assert del_response.status_code == 200
    assert not ProyectoModel.objects.filter(id=proj_a.id).exists()

@pytest.mark.django_db
def test_created_by_cannot_be_manipulated_from_body(api_client, admin_user, user_b):
    # Authenticate as Admin user, but try to assign to User B in POST
    api_client.force_authenticate(user=admin_user)
    post_data = {
        "name": "Proyecto de A",
        "created_by_id": user_b.id,
        "contract_number": "A-1"
    }
    response = api_client.post('/api/proyectos/', data=post_data, format='json')
    assert response.status_code == 201
    
    # Check that created_by is Admin user, not User B
    proj_id = response.data['datos']['id']
    proj = ProyectoModel.objects.get(id=proj_id)
    assert proj.created_by == admin_user
    assert proj.created_by != user_b

    # Clean check on PUT
    put_data = {
        "name": "Proyecto de A Modificado",
        "created_by_id": user_b.id
    }
    response = api_client.put(f'/api/proyectos/{proj.id}/', data=put_data, format='json')
    assert response.status_code == 200
    proj.refresh_from_db()
    assert proj.created_by == admin_user
