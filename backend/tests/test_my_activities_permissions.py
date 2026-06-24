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
    profile.cedula = '11111111'
    profile.save()
    return u

@pytest.fixture
def manager_user():
    u = User.objects.create_user(username='22222222', password='password123', email='manager@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.cedula = '22222222'
    profile.save()
    return u

@pytest.fixture
def regular_user():
    u = User.objects.create_user(username='33333333', password='password123', email='regular@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
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
def action_1(component):
    return AccionModel.objects.create(component=component, name="Accion A", total_sessions=5, proyeccion_cuantitativa=50.0, unidad_medida="Unidades", ejecucion_acumulada=10.0)

@pytest.fixture
def action_2(component):
    return AccionModel.objects.create(component=component, name="Accion B", total_sessions=5, proyeccion_cuantitativa=50.0, unidad_medida="Unidades", ejecucion_acumulada=50.0)

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
        
    _add_perm(rol_coord, 'acciones.ver_mis_asignadas')
    _add_perm(rol_prof, 'acciones.ver_mis_asignadas')
    _add_perm(rol_prof, 'acciones.ejecutar')
    return rol_coord, rol_prof

@pytest.mark.django_db
def test_superadmin_lists_all_activities(api_client, superadmin, action_1, action_2):
    api_client.force_authenticate(user=superadmin)
    res = api_client.get('/api/mis-actividades/')
    assert res.status_code == 200
    names = [item['accion']['nombre'] for item in res.data['datos']]
    assert "Accion A" in names
    assert "Accion B" in names

@pytest.mark.django_db
def test_manager_lists_all_project_activities(api_client, manager_user, project, action_1, action_2, roles_setup):
    rol_coord, _ = roles_setup
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=manager_user, agregado_por=manager_user)
    UsuarioRolModel.objects.create(usuario=manager_user, proyecto=project, rol=rol_coord, activo=True)
    
    api_client.force_authenticate(user=manager_user)
    res = api_client.get('/api/mis-actividades/')
    assert res.status_code == 200
    names = [item['accion']['nombre'] for item in res.data['datos']]
    assert "Accion A" in names
    assert "Accion B" in names

@pytest.mark.django_db
def test_regular_user_only_sees_assigned_activities(api_client, regular_user, project, action_1, action_2, roles_setup):
    _, rol_prof = roles_setup
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_user, agregado_por=regular_user)
    UsuarioRolModel.objects.create(usuario=regular_user, proyecto=project, rol=rol_prof, activo=True)
    
    # Assign regular_user to action_1 but NOT action_2
    AsignacionResponsableAccionModel.objects.create(usuario=regular_user, accion=action_1, tipo_asignacion='responsable', activo=True)
    
    api_client.force_authenticate(user=regular_user)
    res = api_client.get('/api/mis-actividades/')
    assert res.status_code == 200
    names = [item['accion']['nombre'] for item in res.data['datos']]
    assert "Accion A" in names
    assert "Accion B" not in names

@pytest.mark.django_db
def test_filter_by_status(api_client, superadmin, action_1, action_2):
    api_client.force_authenticate(user=superadmin)
    
    # Pendientes
    res_pend = api_client.get('/api/mis-actividades/?estado=pendientes')
    assert res_pend.status_code == 200
    names_pend = [item['accion']['nombre'] for item in res_pend.data['datos']]
    assert "Accion A" in names_pend
    assert "Accion B" not in names_pend

    # Completadas
    res_comp = api_client.get('/api/mis-actividades/?estado=completadas')
    assert res_comp.status_code == 200
    names_comp = [item['accion']['nombre'] for item in res_comp.data['datos']]
    assert "Accion B" in names_comp
    assert "Accion A" not in names_comp
