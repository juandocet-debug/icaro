import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.roles.infraestructura.models import RolModel, PermisoModel, UsuarioRolModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    return User.objects.create_user(username='normaluser', password='password123')

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='adminuser', password='password123', is_staff=True)

@pytest.mark.django_db
def test_normal_user_receives_403_to_manage_roles(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # POST
    res = api_client.post('/api/roles/roles/', data={'nombre': 'Nuevo Rol', 'descripcion': 'Desc'}, format='json')
    assert res.status_code == 403

    # DELETE
    res_del = api_client.delete('/api/roles/roles/some-id/')
    assert res_del.status_code == 403

@pytest.mark.django_db
def test_admin_can_create_and_list_roles(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    
    # 1. Crear
    res_post = api_client.post(
        '/api/roles/roles/',
        data={'nombre': 'Rol Personalizado 1', 'descripcion': 'Descripción de prueba', 'permisos': ['proj_ver']},
        format='json'
    )
    assert res_post.status_code == 201
    assert res_post.data['datos']['nombre'] == 'Rol Personalizado 1'
    
    # 2. Listar
    res_get = api_client.get('/api/roles/roles/')
    assert res_get.status_code == 200
    nombres = [r['nombre'] for r in res_get.data['datos']]
    assert 'Rol Personalizado 1' in nombres

@pytest.mark.django_db
def test_prevent_duplicated_role_names(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    
    res1 = api_client.post('/api/roles/roles/', data={'nombre': 'Duplicado', 'descripcion': 'Desc'}, format='json')
    assert res1.status_code == 201
    
    res2 = api_client.post('/api/roles/roles/', data={'nombre': 'Duplicado', 'descripcion': 'Desc'}, format='json')
    assert res2.status_code == 400
    assert 'Ya existe un rol con ese nombre' in res2.data['error']

@pytest.mark.django_db
def test_cannot_delete_or_edit_system_roles(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    
    # Obtener el rol del sistema
    rol_sys = RolModel.objects.get(nombre='Superadministrador')
    
    # Editar
    res_patch = api_client.patch(f'/api/roles/roles/{rol_sys.id}/', data={'nombre': 'SuperHack'}, format='json')
    assert res_patch.status_code == 400
    
    # Eliminar
    res_del = api_client.delete(f'/api/roles/roles/{rol_sys.id}/')
    assert res_del.status_code == 400

@pytest.mark.django_db
def test_hierarchical_scopes_validation(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    
    proj1 = ProyectoModel.objects.create(name="Proj 1")
    proj2 = ProyectoModel.objects.create(name="Proj 2")
    from modulos.metas.infraestructura.models import MetaModel
    meta1 = MetaModel.objects.create(proyecto=proj1, nombre="Meta 1", activo=True, created_by=admin_user)
    meta2 = MetaModel.objects.create(proyecto=proj2, nombre="Meta 2", activo=True, created_by=admin_user)
    comp1 = ComponenteModel.objects.create(project=proj1, meta=meta1, name="Comp 1")
    comp2 = ComponenteModel.objects.create(project=proj2, meta=meta2, name="Comp 2")
    acc2 = AccionModel.objects.create(component=comp2, name="Acc 2")

    # Intentar mandar un componente de proj1 con un proyecto proj2
    res = api_client.post(
        '/api/roles/roles/',
        data={
            'nombre': 'Rol Jerarquia 1',
            'descripcion': 'Desc',
            'proyecto': str(proj2.id),
            'componente': str(comp1.id)
        },
        format='json'
    )
    assert res.status_code == 400
    assert 'El componente no pertenece al proyecto especificado' in res.data['error']

@pytest.mark.django_db
def test_normal_user_receives_403_on_members_mutations(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    proyecto = ProyectoModel.objects.create(name="Proyecto Test")
    
    # POST
    res = api_client.post(f'/api/proyectos/{proyecto.id}/miembros/', data={'username': 'adminuser', 'rol_id': 'some-id'}, format='json')
    assert res.status_code == 403

@pytest.mark.django_db
def test_active_roles_filtering(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    
    # Desactivar un rol
    rol = RolModel.objects.create(nombre='Rol Inactivo', descripcion='Desc', activo=False)
    
    # Listar todos
    res_all = api_client.get('/api/roles/roles/')
    nombres_all = [r['nombre'] for r in res_all.data['datos']]
    assert 'Rol Inactivo' in nombres_all

    # Listar activos
    res_act = api_client.get('/api/roles/roles/?activo=true')
    nombres_act = [r['nombre'] for r in res_act.data['datos']]
    assert 'Rol Inactivo' not in nombres_act

