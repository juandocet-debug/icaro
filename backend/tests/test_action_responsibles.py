import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.acciones.infraestructura.models import AccionModel, AsignacionResponsableAccionModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
from modulos.miembros.infraestructura.models import ProyectoMiembroModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.autenticacion.infraestructura.models import ProfileModel

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def superadmin():
    u = User.objects.create_superuser(username='11111111', password='password123', email='super@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.primer_nombre = 'Super'
    profile.primer_apellido = 'Admin'
    profile.cedula = '11111111'
    profile.save()
    return u

@pytest.fixture
def project_manager():
    u = User.objects.create_user(username='22222222', password='password123', email='manager@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.primer_nombre = 'Proj'
    profile.primer_apellido = 'Manager'
    profile.cedula = '22222222'
    profile.save()
    return u

@pytest.fixture
def regular_member():
    u = User.objects.create_user(username='33333333', password='password123', email='regular@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.primer_nombre = 'Reg'
    profile.primer_apellido = 'Member'
    profile.cedula = '33333333'
    profile.save()
    return u

@pytest.fixture
def project(superadmin):
    return ProyectoModel.objects.create(name="Proyecto Test", created_by=superadmin)

@pytest.fixture
def meta(project, superadmin):
    return MetaModel.objects.create(proyecto=project, nombre="Meta Test", created_by=superadmin)

@pytest.fixture
def component(project, meta):
    return ComponenteModel.objects.create(project=project, meta=meta, name="Componente Test")

@pytest.fixture
def action(component):
    return AccionModel.objects.create(component=component, name="Accion Test", total_sessions=5, proyeccion_cuantitativa=50.0, unidad_medida="Unidades")

@pytest.fixture
def roles_setup():
    from modulos.roles.infraestructura.models import PermisoModel, RolPermisoModel
    rol_coord, _ = RolModel.objects.get_or_create(
        codigo='coordinador_proyecto',
        defaults={
            'nombre': 'Coordinador de Proyecto',
            'tipo_alcance': 'proyecto',
            'activo': True
        }
    )
    rol_prof, _ = RolModel.objects.get_or_create(
        codigo='profesional_carga',
        defaults={
            'nombre': 'Profesional de Carga',
            'tipo_alcance': 'proyecto',
            'activo': True
        }
    )
    
    def _add_perm(rol, cod):
        p, _ = PermisoModel.objects.get_or_create(codigo=cod, defaults={'nombre': cod, 'modulo': 'acciones'})
        RolPermisoModel.objects.get_or_create(rol=rol, permiso=p)
        
    _add_perm(rol_coord, 'acciones.asignar_responsables')
    _add_perm(rol_coord, 'acciones.ver_mis_asignadas')
    _add_perm(rol_prof, 'acciones.ver_mis_asignadas')
    _add_perm(rol_prof, 'acciones.ejecutar')
    return rol_coord, rol_prof

@pytest.mark.django_db
def test_superadmin_puedes_asignar_y_retirar_responsable(api_client, superadmin, regular_member, project, component, action, roles_setup):
    _, rol_prof = roles_setup
    # El usuario regular debe ser miembro del proyecto con un rol activo para poder ser asignable
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_member, agregado_por=superadmin)
    UsuarioRolModel.objects.create(usuario=regular_member, proyecto=project, rol=rol_prof, activo=True)
    
    api_client.force_authenticate(user=superadmin)
    
    # Asignar
    res = api_client.post(
        f'/api/acciones/{component.id}/acciones/{action.id}/responsables/',
        data={'usuario_id': regular_member.id, 'tipo_asignacion': 'responsable'},
        format='json'
    )
    assert res.status_code == 201
    assert AsignacionResponsableAccionModel.objects.filter(usuario=regular_member, accion=action, activo=True).exists()

    # Listar
    res_list = api_client.get(f'/api/acciones/{component.id}/acciones/{action.id}/responsables/')
    assert res_list.status_code == 200
    assert len(res_list.data) >= 1

    # Retirar
    asignacion = AsignacionResponsableAccionModel.objects.get(usuario=regular_member, accion=action, activo=True)
    res_delete = api_client.delete(f'/api/acciones/{component.id}/acciones/{action.id}/responsables/{asignacion.id}/')
    assert res_delete.status_code == 200
    assert not AsignacionResponsableAccionModel.objects.filter(usuario=regular_member, accion=action, activo=True).exists()

@pytest.mark.django_db
def test_coordinador_proyecto_puede_asignar_miembro(api_client, project_manager, regular_member, project, component, action, roles_setup):
    rol_coord, rol_prof = roles_setup
    
    # Asignar rol de coordinador al project_manager
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=project_manager, agregado_por=project_manager)
    UsuarioRolModel.objects.create(usuario=project_manager, proyecto=project, rol=rol_coord, activo=True)

    # El regular_member es miembro
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_member, agregado_por=project_manager)
    UsuarioRolModel.objects.create(usuario=regular_member, proyecto=project, rol=rol_prof, activo=True)

    api_client.force_authenticate(user=project_manager)
    res = api_client.post(
        f'/api/acciones/{component.id}/acciones/{action.id}/responsables/',
        data={'usuario_id': regular_member.id, 'tipo_asignacion': 'apoyo'},
        format='json'
    )
    assert res.status_code == 201
    assert AsignacionResponsableAccionModel.objects.filter(usuario=regular_member, accion=action, tipo_asignacion='apoyo', activo=True).exists()

@pytest.mark.django_db
def test_miembro_sin_permiso_da_403(api_client, regular_member, project, component, action, roles_setup):
    _, rol_prof = roles_setup
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_member, agregado_por=regular_member)
    UsuarioRolModel.objects.create(usuario=regular_member, proyecto=project, rol=rol_prof, activo=True)

    api_client.force_authenticate(user=regular_member)
    res = api_client.post(
        f'/api/acciones/{component.id}/acciones/{action.id}/responsables/',
        data={'usuario_id': regular_member.id, 'tipo_asignacion': 'responsable'},
        format='json'
    )
    assert res.status_code == 403

@pytest.mark.django_db
def test_cascade_deactivation_on_user_inactive(api_client, superadmin, regular_member, project, component, action, roles_setup):
    _, rol_prof = roles_setup
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_member, agregado_por=superadmin)
    UsuarioRolModel.objects.create(usuario=regular_member, proyecto=project, rol=rol_prof, activo=True)
    
    # Crear asignacion
    AsignacionResponsableAccionModel.objects.create(usuario=regular_member, accion=action, tipo_asignacion='responsable', activo=True, assigned_by=superadmin)
    
    # Desactivar usuario
    from modulos.autenticacion.infraestructura.DjangoUsuarioRepository import DjangoUsuarioRepository
    repo = DjangoUsuarioRepository()
    repo.actualizar(regular_member.id, {'is_active': False})
    
    # Verificar asignacion desactivada
    assert not AsignacionResponsableAccionModel.objects.filter(usuario=regular_member, accion=action, activo=True).exists()

@pytest.mark.django_db
def test_cascade_deactivation_on_member_retired(api_client, superadmin, regular_member, project, component, action, roles_setup):
    _, rol_prof = roles_setup
    miembro = ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_member, agregado_por=superadmin)
    UsuarioRolModel.objects.create(usuario=regular_member, proyecto=project, rol=rol_prof, activo=True)
    
    # Crear asignacion
    AsignacionResponsableAccionModel.objects.create(usuario=regular_member, accion=action, tipo_asignacion='responsable', activo=True, assigned_by=superadmin)
    
    # Retirar miembro
    from modulos.miembros.infraestructura.DjangoAsignacionMiembroRolRepository import DjangoAsignacionMiembroRolRepository
    repo = DjangoAsignacionMiembroRolRepository()
    repo.retirar_miembro_del_proyecto(project.id, miembro.id)
    
    # Verificar asignacion desactivada
    assert not AsignacionResponsableAccionModel.objects.filter(usuario=regular_member, accion=action, activo=True).exists()
