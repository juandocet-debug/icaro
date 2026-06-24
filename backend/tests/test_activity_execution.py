import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from modulos.acciones.infraestructura.models import AccionModel, AsignacionResponsableAccionModel, HistorialEjecucionAccionModel
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
def regular_user():
    u = User.objects.create_user(username='33333333', password='password123', email='regular@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.cedula = '33333333'
    profile.save()
    return u

@pytest.fixture
def other_user():
    u = User.objects.create_user(username='44444444', password='password123', email='other@example.com')
    profile, _ = ProfileModel.objects.get_or_create(user=u)
    profile.cedula = '44444444'
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
    return AccionModel.objects.create(component=component, name="Accion Test", total_sessions=5, proyeccion_cuantitativa=50.0, unidad_medida="Unidades", ejecucion_acumulada=10.0)

@pytest.fixture
def roles_setup():
    from modulos.roles.infraestructura.models import PermisoModel, RolPermisoModel
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
        
    _add_perm(rol_prof, 'acciones.ejecutar')
    _add_perm(rol_prof, 'acciones.ver_mis_asignadas')
    return rol_prof

@pytest.mark.django_db
def test_responsable_puedes_registrar_ejecucion(api_client, regular_user, project, component, action, roles_setup):
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_user, agregado_por=regular_user)
    UsuarioRolModel.objects.create(usuario=regular_user, proyecto=project, rol=roles_setup, activo=True)
    
    # Assign as responsable
    AsignacionResponsableAccionModel.objects.create(usuario=regular_user, accion=action, tipo_asignacion='responsable', activo=True)
    
    api_client.force_authenticate(user=regular_user)
    res = api_client.post(
        f'/api/mis-actividades/{action.id}/ejecucion/',
        data={'cantidad': 15.0},
        format='json'
    )
    assert res.status_code == 200
    action.refresh_from_db()
    assert float(action.ejecucion_acumulada) == 25.0
    assert HistorialEjecucionAccionModel.objects.filter(accion=action, usuario=regular_user, cantidad=15.0).exists()

@pytest.mark.django_db
def test_apoyo_no_puede_registrar_ejecucion(api_client, regular_user, project, component, action, roles_setup):
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_user, agregado_por=regular_user)
    UsuarioRolModel.objects.create(usuario=regular_user, proyecto=project, rol=roles_setup, activo=True)
    
    # Assign as apoyo
    AsignacionResponsableAccionModel.objects.create(usuario=regular_user, accion=action, tipo_asignacion='apoyo', activo=True)
    
    api_client.force_authenticate(user=regular_user)
    res = api_client.post(
        f'/api/mis-actividades/{action.id}/ejecucion/',
        data={'cantidad': 15.0},
        format='json'
    )
    assert res.status_code == 403

@pytest.mark.django_db
def test_no_puede_superar_proyeccion(api_client, regular_user, project, component, action, roles_setup):
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_user, agregado_por=regular_user)
    UsuarioRolModel.objects.create(usuario=regular_user, proyecto=project, rol=roles_setup, activo=True)
    
    # Assign as responsable
    AsignacionResponsableAccionModel.objects.create(usuario=regular_user, accion=action, tipo_asignacion='responsable', activo=True)
    
    api_client.force_authenticate(user=regular_user)
    res = api_client.post(
        f'/api/mis-actividades/{action.id}/ejecucion/',
        data={'cantidad': 45.0},  # 10 + 45 = 55 > 50 projection
        format='json'
    )
    assert res.status_code == 400
    assert "superar la proyección" in res.data['error']

@pytest.mark.django_db
def test_cantidad_negativa_invalida(api_client, regular_user, project, component, action, roles_setup):
    ProyectoMiembroModel.objects.create(proyecto=project, usuario=regular_user, agregado_por=regular_user)
    UsuarioRolModel.objects.create(usuario=regular_user, proyecto=project, rol=roles_setup, activo=True)
    
    AsignacionResponsableAccionModel.objects.create(usuario=regular_user, accion=action, tipo_asignacion='responsable', activo=True)
    
    api_client.force_authenticate(user=regular_user)
    res = api_client.post(
        f'/api/mis-actividades/{action.id}/ejecucion/',
        data={'cantidad': -5.0},
        format='json'
    )
    assert res.status_code == 400
    assert "no puede ser negativa" in res.data['error']
