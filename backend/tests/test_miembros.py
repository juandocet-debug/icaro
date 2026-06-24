import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.miembros.infraestructura.models import ProyectoMiembroModel

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    return User.objects.create_user(username='normaluser', password='password123', first_name='Normal', last_name='User')

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='adminuser', password='password123', email='admin@example.com')

@pytest.mark.django_db
def test_miembros_get_without_token_returns_401(api_client):
    user = User.objects.create_user(username='owner', password='password123')
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=user)
    
    res = api_client.get(f'/api/proyectos/{proyecto.id}/miembros/')
    assert res.status_code == 401

@pytest.mark.django_db
def test_miembros_get_non_member_returns_403(api_client, test_user):
    owner = User.objects.create_user(username='owner', password='password123')
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=owner)
    
    api_client.force_authenticate(user=test_user)
    res = api_client.get(f'/api/proyectos/{proyecto.id}/miembros/')
    assert res.status_code == 403

@pytest.mark.django_db
def test_miembros_post_normal_user_returns_403(api_client, test_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=test_user)
    api_client.force_authenticate(user=test_user)
    from modulos.roles.infraestructura.models import RolModel
    rol_obj = RolModel.objects.get(nombre='Coordinador de proyecto')
    
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_obj.id)},
        format='json'
    )
    assert res.status_code == 403

@pytest.mark.django_db
def test_miembros_admin_lifecycle(api_client, admin_user, test_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    api_client.force_authenticate(user=admin_user)
    
    from modulos.roles.infraestructura.models import RolModel
    rol_coord = RolModel.objects.get(nombre='Coordinador de proyecto')
    rol_dir = RolModel.objects.get(codigo='verificador')

    # 1. Agregar miembro
    res_post = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_coord.id)},
        format='json'
    )
    assert res_post.status_code == 201
    assert res_post.data['ok'] is True
    assert res_post.data['datos']['username'] == 'normaluser'
    miembro_id = res_post.data['datos']['id']
    asignacion_id = res_post.data['datos']['roles'][0]['id']

    # 2. Agregar duplicado
    res_dup = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_coord.id)},
        format='json'
    )
    assert res_dup.status_code == 400

    # 3. Listar miembros
    res_list = api_client.get(f'/api/proyectos/{proyecto.id}/miembros/')
    assert res_list.status_code == 200
    assert len(res_list.data['datos']) == 1

    # 4. Actualizar rol
    res_patch = api_client.patch(
        f'/api/proyectos/{proyecto.id}/miembros/roles/{asignacion_id}/',
        data={'rol_id': str(rol_dir.id)},
        format='json'
    )
    assert res_patch.status_code == 200
    assert res_patch.data['datos']['roles'][0]['rol_nombre'] == rol_dir.nombre

    # 5. Eliminar miembro
    res_del = api_client.delete(f'/api/proyectos/{proyecto.id}/miembros/{miembro_id}/')
    assert res_del.status_code == 200

@pytest.mark.django_db
def test_usuarios_list_permissions(api_client, admin_user, test_user):
    # Admin can list
    api_client.force_authenticate(user=admin_user)
    res_admin = api_client.get('/api/auth/usuarios/')
    assert res_admin.status_code == 200

    # Normal user cannot
    api_client.force_authenticate(user=test_user)
    res_user = api_client.get('/api/auth/usuarios/')
    assert res_user.status_code == 403

@pytest.mark.django_db
def test_miembros_role_scope_constraints(api_client, admin_user, test_user):
    proyecto = ProyectoModel.objects.create(name="Proyecto Test", created_by=admin_user)
    api_client.force_authenticate(user=admin_user)
    
    from modulos.roles.infraestructura.models import RolModel
    from modulos.componentes.infraestructura.models import ComponenteModel
    from modulos.acciones.infraestructura.models import AccionModel
    
    # Setup roles with different scopes
    rol_inactive = RolModel.objects.create(codigo="rol_inactive_test", nombre="Rol Inactivo", descripcion="Desc", activo=False, tipo_alcance="proyecto")
    rol_global = RolModel.objects.create(codigo="rol_global_test", nombre="Rol Global Test", descripcion="Desc", activo=True, tipo_alcance="global")
    rol_comp = RolModel.objects.create(codigo="rol_comp_test", nombre="Rol Comp Test", descripcion="Desc", activo=True, tipo_alcance="componente")
    rol_acc = RolModel.objects.create(codigo="rol_acc_test", nombre="Rol Acc Test", descripcion="Desc", activo=True, tipo_alcance="accion")
    
    from modulos.metas.infraestructura.models import MetaModel
    meta = MetaModel.objects.create(proyecto=proyecto, nombre="Meta Test", activo=True, created_by=admin_user)
    comp_ok = ComponenteModel.objects.create(project=proyecto, meta=meta, name="Comp Ok")
    
    # 1. Un rol inactivo no puede asignarse
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_inactive.id)},
        format='json'
    )
    assert res.status_code == 400
    assert "no está activo" in res.data['error']
    
    # 2. Superadministrador / global no se asigna desde proyecto
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_global.id)},
        format='json'
    )
    assert res.status_code == 400
    assert "global desde un proyecto" in res.data['error']
    
    # 3. Rol de alcance componente exige componente válido
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_comp.id)},
        format='json'
    )
    assert res.status_code == 400
    assert "exige componente válido" in res.data['error']
    
    # 4. Rol de alcance acción exige componente y acción válidos
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_acc.id), 'componente_id': str(comp_ok.id)},
        format='json'
    )
    assert res.status_code == 400
    assert "exige componente y acción válidos" in res.data['error']
    
    # 5. Componente ajeno al proyecto retorna 400 o 403
    proyecto_other = ProyectoModel.objects.create(name="Otro Proyecto", created_by=admin_user)
    meta_other = MetaModel.objects.create(proyecto=proyecto_other, nombre="Meta Other", activo=True, created_by=admin_user)
    comp_other = ComponenteModel.objects.create(project=proyecto_other, meta=meta_other, name="Comp Other")
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_comp.id), 'componente_id': str(comp_other.id)},
        format='json'
    )
    assert res.status_code == 400
    assert "no pertenece al proyecto" in res.data['error']
    
    # 6. Acción ajena al componente retorna 400 o 403
    comp_other_same_proj = ComponenteModel.objects.create(project=proyecto, meta=meta, name="Comp Other Same Proj")
    acc_other = AccionModel.objects.create(component=comp_other_same_proj, name="Acc Other")
    res = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'normaluser', 'rol_id': str(rol_acc.id), 'componente_id': str(comp_ok.id), 'accion_id': str(acc_other.id)},
        format='json'
    )
    assert res.status_code == 400
    assert "no pertenece al componente" in res.data['error']


@pytest.mark.django_db
def test_administrador_proyecto_permissions(api_client, admin_user):
    # 1. Crear proyectos
    proj_a = ProyectoModel.objects.create(name="Proyecto A", created_by=admin_user)
    proj_b = ProyectoModel.objects.create(name="Proyecto B", created_by=admin_user)
    
    # 2. pm_user es un usuario normal
    pm_user = User.objects.create_user(username='pm_user', password='password123')
    other_user = User.objects.create_user(username='other_user', password='password123')
    
    # 3. Asignarle el rol administrador_proyecto en proj_a
    from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
    rol_admin_proj = RolModel.objects.get(codigo='administrador_proyecto')
    rol_coord = RolModel.objects.get(codigo='coordinador_proyecto')
    
    UsuarioRolModel.objects.create(
        usuario=pm_user,
        rol=rol_admin_proj,
        proyecto=proj_a,
        activo=True
    )
    ProyectoMiembroModel.objects.create(
        proyecto=proj_a,
        usuario=pm_user,
        agregado_por=admin_user
    )
    
    # 4. Autenticar como pm_user
    api_client.force_authenticate(user=pm_user)
    
    # Puede gestionar miembros en proj_a (POST /api/proyectos/proj_a/miembros/)
    res_post = api_client.post(
        f'/api/proyectos/{proj_a.id}/miembros/',
        data={'username': 'other_user', 'rol_id': str(rol_coord.id)},
        format='json'
    )
    assert res_post.status_code == 201
    miembro_id = res_post.data['datos']['id']
    asignacion_id = res_post.data['datos']['roles'][0]['id']

    # Puede editar miembro en proj_a (PATCH)
    rol_verificador = RolModel.objects.get(codigo='verificador')
    res_patch = api_client.patch(
        f'/api/proyectos/{proj_a.id}/miembros/roles/{asignacion_id}/',
        data={'rol_id': str(rol_verificador.id)},
        format='json'
    )
    assert res_patch.status_code == 200
    assert res_patch.data['datos']['rol_nombre'] == 'Verificador'

    # Puede retirar miembro en proj_a (DELETE)
    res_delete = api_client.delete(
        f'/api/proyectos/{proj_a.id}/miembros/{miembro_id}/'
    )
    assert res_delete.status_code == 200
    
    # No puede gestionar miembros en proj_b (POST /api/proyectos/proj_b/miembros/) -> IDOR / 403
    res_post_b = api_client.post(
        f'/api/proyectos/{proj_b.id}/miembros/',
        data={'username': 'other_user', 'rol_id': str(rol_coord.id)},
        format='json'
    )
    assert res_post_b.status_code == 403

    # Creamos un miembro en proj_b para probar IDOR
    m_proj_b = ProyectoMiembroModel.objects.create(
        proyecto=proj_b,
        usuario=other_user,
        agregado_por=admin_user
    )
    asignacion_proj_b = UsuarioRolModel.objects.create(
        usuario=other_user,
        rol=rol_coord,
        proyecto=proj_b,
        activo=True,
    )
    # pm_user intenta editar una asignacion concreta en proj_b.
    res_patch_b = api_client.patch(
        f'/api/proyectos/{proj_b.id}/miembros/roles/{asignacion_proj_b.id}/',
        data={'rol_id': str(rol_verificador.id)},
        format='json'
    )
    assert res_patch_b.status_code == 403
    
    # pm_user intenta hacer delete en proj_b
    res_delete_b = api_client.delete(
        f'/api/proyectos/{proj_b.id}/miembros/{m_proj_b.id}/'
    )
    assert res_delete_b.status_code == 403
    
    # No puede crear usuarios globales
    res_crear_usr = api_client.post(
        '/api/auth/usuarios/',
        data={'cedula': '999999', 'first_name': 'No', 'last_name': 'Permitido'},
        format='json'
    )
    assert res_crear_usr.status_code == 403
    
    # No puede crear roles
    res_crear_rol = api_client.post(
        '/api/roles/roles/',
        data={'nombre': 'Rol Invalido', 'descripcion': 'Desc'},
        format='json'
    )
    assert res_crear_rol.status_code == 403


@pytest.mark.django_db
def test_atomic_assignment_invariants(api_client, admin_user):
    from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
    from modulos.miembros.infraestructura.models import ProyectoMiembroModel
    
    proyecto = ProyectoModel.objects.create(name="Proyecto Inv", created_by=admin_user)
    usuario = User.objects.create_user(username='inv_user', password='password123')
    rol_coord = RolModel.objects.get(codigo='coordinador_proyecto')
    
    api_client.force_authenticate(user=admin_user)
    
    # 1. Crear asignación produce un miembro y un UsuarioRolModel
    res_post = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'inv_user', 'rol_id': str(rol_coord.id)},
        format='json'
    )
    assert res_post.status_code == 201
    
    # Verificar existencia en BD
    assert ProyectoMiembroModel.objects.filter(proyecto=proyecto, usuario=usuario).exists()
    assert UsuarioRolModel.objects.filter(proyecto=proyecto, usuario=usuario, activo=True).count() == 1
    
    # 2. Se permiten múltiples roles activos para usuario y proyecto (Ticket 63)
    rol_verif = RolModel.objects.get(codigo='verificador')
    
    # Asignar otro rol al mismo usuario en el mismo proyecto debe tener éxito con 201
    res_dup = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'inv_user', 'rol_id': str(rol_verif.id)},
        format='json'
    )
    assert res_dup.status_code == 201
    assert UsuarioRolModel.objects.filter(proyecto=proyecto, usuario=usuario, activo=True).count() == 2
    
    # 3. La ruta antigua no puede actualizar un miembro cuando tiene varios roles.
    miembro = ProyectoMiembroModel.objects.get(proyecto=proyecto, usuario=usuario)
    res_patch = api_client.patch(
        f'/api/proyectos/{proyecto.id}/miembros/{miembro.id}/',
        data={'rol_id': str(rol_verif.id)},
        format='json'
    )
    assert res_patch.status_code == 405
    assert UsuarioRolModel.objects.filter(proyecto=proyecto, usuario=usuario, activo=True, rol=rol_coord).exists()
    assert UsuarioRolModel.objects.filter(proyecto=proyecto, usuario=usuario, activo=True, rol=rol_verif).exists()
    
    # 4. Retirar miembro elimina todos sus UsuarioRolModel
    res_delete = api_client.delete(f'/api/proyectos/{proyecto.id}/miembros/{miembro.id}/')
    assert res_delete.status_code == 200
    assert not ProyectoMiembroModel.objects.filter(proyecto=proyecto, usuario=usuario).exists()
    assert not UsuarioRolModel.objects.filter(proyecto=proyecto, usuario=usuario, activo=True).exists()

    # 5. Rol personalizado se asigna sin mapeos ni conversiones
    rol_custom = RolModel.objects.create(
        codigo="rol_custom_test",
        nombre="Rol Custom Test",
        descripcion="Custom desc",
        activo=True,
        tipo_alcance="proyecto",
        es_sistema=False
    )
    res_post_custom = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'inv_user', 'rol_id': str(rol_custom.id)},
        format='json'
    )
    assert res_post_custom.status_code == 201
    asig_custom = UsuarioRolModel.objects.filter(proyecto=proyecto, usuario=usuario, activo=True).first()
    assert asig_custom is not None
    assert asig_custom.rol == rol_custom

    # 6. Atomicidad en fallos: si falla la asignación de rol (ej: componente inválido), no debe crearse el miembro
    from modulos.miembros.infraestructura.DjangoAsignacionMiembroRolRepository import DjangoAsignacionMiembroRolRepository
    repo = DjangoAsignacionMiembroRolRepository()
    
    usuario_fail = User.objects.create_user(username='fail_user', password='password123')
    rol_comp = RolModel.objects.get(codigo='coordinador_componente')
    
    with pytest.raises(ValueError):
        repo.agregar_rol_a_miembro(
            proyecto_id=str(proyecto.id),
            usuario_id=usuario_fail.id,
            rol_id=str(rol_comp.id),
            componente_id="00000000-0000-0000-0000-000000000000" # componente inexistente
        )
        
    assert not ProyectoMiembroModel.objects.filter(proyecto=proyecto, usuario=usuario_fail).exists()
    assert not UsuarioRolModel.objects.filter(proyecto=proyecto, usuario=usuario_fail).exists()
