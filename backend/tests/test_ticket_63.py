import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
from modulos.miembros.infraestructura.models import ProyectoMiembroModel
from decimal import Decimal

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def superuser():
    return User.objects.create_superuser(username='superadmin', password='password123', is_superuser=True)

@pytest.fixture
def admin_proj_user():
    return User.objects.create_user(username='admin_proj', password='password123')

@pytest.fixture
def coord_gen_user():
    return User.objects.create_user(username='coord_gen', password='password123')

@pytest.fixture
def operator_user():
    return User.objects.create_user(username='operator', password='password123')

@pytest.mark.django_db
def test_metas_core_functionality(api_client, superuser, admin_proj_user, coord_gen_user, operator_user):
    # Setup projects
    proj_a = ProyectoModel.objects.create(name="Proyecto A", created_by=superuser)
    proj_b = ProyectoModel.objects.create(name="Proyecto B", created_by=superuser)

    # Assign roles
    rol_admin_proj = RolModel.objects.get(codigo='administrador_proyecto')
    rol_coord_gen = RolModel.objects.get(codigo='coordinador_general')
    rol_carga = RolModel.objects.get(codigo='profesional_carga')

    # Assign admin_proj_user to proj_a
    UsuarioRolModel.objects.create(usuario=admin_proj_user, rol=rol_admin_proj, proyecto=proj_a, activo=True)
    ProyectoMiembroModel.objects.create(proyecto=proj_a, usuario=admin_proj_user)

    # Assign coord_gen_user to proj_a
    UsuarioRolModel.objects.create(usuario=coord_gen_user, rol=rol_coord_gen, proyecto=proj_a, activo=True)
    ProyectoMiembroModel.objects.create(proyecto=proj_a, usuario=coord_gen_user)

    # Assign operator_user to proj_a
    UsuarioRolModel.objects.create(usuario=operator_user, rol=rol_carga, proyecto=proj_a, activo=True)
    ProyectoMiembroModel.objects.create(proyecto=proj_a, usuario=operator_user)

    # 1. Admin de proyecto crea meta en proyecto propio
    api_client.force_authenticate(user=admin_proj_user)
    res = api_client.post(
        f'/api/proyectos/{proj_a.id}/metas/',
        data={'nombre': 'Meta A1', 'unidad_medida': 'porcentaje', 'valor_objetivo': 100.0, 'descripcion': 'Desc'},
        format='json'
    )
    assert res.status_code == 201
    meta_id = res.data['datos']['id']

    # 2. Admin de proyecto recibe 403 al crear meta en proyecto ajeno (proj_b)
    res_forbidden = api_client.post(
        f'/api/proyectos/{proj_b.id}/metas/',
        data={'nombre': 'Meta B1', 'unidad_medida': 'porcentaje', 'valor_objetivo': 100.0},
        format='json'
    )
    assert res_forbidden.status_code == 403

    # 3. Coordinador general puede crear y editar en proyecto asignado
    api_client.force_authenticate(user=coord_gen_user)
    res_create_cg = api_client.post(
        f'/api/proyectos/{proj_a.id}/metas/',
        data={'nombre': 'Meta CG', 'unidad_medida': 'porcentaje', 'valor_objetivo': 50.0},
        format='json'
    )
    assert res_create_cg.status_code == 201
    meta_cg_id = res_create_cg.data['datos']['id']

    res_edit_cg = api_client.patch(
        f'/api/proyectos/{proj_a.id}/metas/{meta_cg_id}/',
        data={'nombre': 'Meta CG Editada'},
        format='json'
    )
    assert res_edit_cg.status_code == 200
    assert res_edit_cg.data['datos']['nombre'] == 'Meta CG Editada'

    # 4. Profesional de carga recibe 403 al crear meta
    api_client.force_authenticate(user=operator_user)
    res_operator_forbidden = api_client.post(
        f'/api/proyectos/{proj_a.id}/metas/',
        data={'nombre': 'Meta Operator', 'unidad_medida': 'unidades', 'valor_objetivo': 10.0},
        format='json'
    )
    assert res_operator_forbidden.status_code == 403

    # 5. Superadministrador puede hacer todo en cualquier proyecto
    api_client.force_authenticate(user=superuser)
    res_super_create = api_client.post(
        f'/api/proyectos/{proj_b.id}/metas/',
        data={'nombre': 'Meta Super B', 'unidad_medida': 'unidades', 'valor_objetivo': 10.0},
        format='json'
    )
    assert res_super_create.status_code == 201

    # 6. Proyecto con varias metas, meta con varios componentes
    meta_a = MetaModel.objects.get(id=meta_id)
    comp_1 = ComponenteModel.objects.create(project=proj_a, meta=meta_a, name="Comp 1")
    comp_2 = ComponenteModel.objects.create(project=proj_a, meta=meta_a, name="Comp 2")
    assert meta_a.componentes.count() == 2

    # 7. Componente no puede asociarse a meta de otro proyecto
    meta_b = MetaModel.objects.get(id=res_super_create.data['datos']['id'])
    with pytest.raises(ValueError) as excinfo:
        # DjangoComponenteRepository.crear performs the cross-project validation
        from modulos.componentes.infraestructura.DjangoComponenteRepository import DjangoComponenteRepository
        from modulos.componentes.dominio.Entidades import Componente
        repo = DjangoComponenteRepository()
        comp_ent = Componente.crear(proyecto_id=str(proj_a.id), meta_id=str(meta_b.id), name="Invalid Comp")
        repo.crear(comp_ent)
    assert "meta de otro proyecto" in str(excinfo.value)

    # 8. Múltiples roles para usuario en el mismo proyecto sin duplicarse
    # Asignar rol verificador adicional a admin_proj_user en proj_a
    from modulos.miembros.infraestructura.DjangoAsignacionMiembroRolRepository import DjangoAsignacionMiembroRolRepository
    member_repo = DjangoAsignacionMiembroRolRepository()
    
    rol_verif = RolModel.objects.get(codigo='verificador')
    # Asignar un rol diferente
    member_repo.agregar_rol_a_miembro(
        proyecto_id=str(proj_a.id),
        usuario_id=admin_proj_user.id,
        rol_id=str(rol_verif.id)
    )

    # Validar que tiene dos roles activos en UsuarioRolModel
    active_roles = UsuarioRolModel.objects.filter(usuario=admin_proj_user, proyecto=proj_a, activo=True)
    assert active_roles.count() == 2

    # Intentar asignar la misma exacta asignación debe fallar
    with pytest.raises(ValueError) as exc_dup:
        member_repo.agregar_rol_a_miembro(
            proyecto_id=str(proj_a.id),
            usuario_id=admin_proj_user.id,
            rol_id=str(rol_verif.id)
        )
    assert "ya existe y está activa" in str(exc_dup.value)

    # 9. Metas archivadas no aparecen por defecto pero permanecen
    api_client.force_authenticate(user=admin_proj_user)
    # Can't archive meta_a because it has active components (comp_1, comp_2)
    res_archive_failed = api_client.post(f'/api/proyectos/{proj_a.id}/metas/{meta_id}/archivar/')
    assert res_archive_failed.status_code == 400
    assert "componentes activos" in res_archive_failed.data['error']

    # Archive meta_cg which has no components
    res_archive_ok = api_client.post(f'/api/proyectos/{proj_a.id}/metas/{meta_cg_id}/archivar/')
    assert res_archive_ok.status_code == 200
    assert res_archive_ok.data['datos']['activo'] is False

    # Check listing: meta_cg should not be returned in default listing
    res_list = api_client.get(f'/api/proyectos/{proj_a.id}/metas/')
    assert res_list.status_code == 200
    meta_ids = [m['id'] for m in res_list.data['datos']]
    assert meta_cg_id not in meta_ids


@pytest.mark.django_db
def test_ticket_63_integrity_and_validation(api_client, superuser):
    from modulos.auditoria.infraestructura.models import AuditLogModel
    from django.core.exceptions import ValidationError
    
    proj_a = ProyectoModel.objects.create(name="Proyecto A", created_by=superuser)
    proj_b = ProyectoModel.objects.create(name="Proyecto B", created_by=superuser)
    
    meta_a = MetaModel.objects.create(
        proyecto=proj_a,
        nombre="Meta A",
        activo=True,
        created_by=superuser
    )
    
    meta_b = MetaModel.objects.create(
        proyecto=proj_b,
        nombre="Meta B",
        activo=True,
        created_by=superuser
    )

    # 1. ORM creation of ComponenteModel directly with project A and meta B (from project B) must fail with ValidationError
    comp_invalid = ComponenteModel(project=proj_a, meta=meta_b, name="Invalid Comp")
    with pytest.raises(ValidationError) as exc:
        comp_invalid.full_clean()
    assert "belongs to another project" in str(exc.value).lower() or "otro proyecto" in str(exc.value).lower()

    # 2. Creating a component directly with no meta raises ValidationError
    comp_no_meta = ComponenteModel(project=proj_a, name="No Meta Comp")
    with pytest.raises(ValidationError):
        comp_no_meta.full_clean()

    # 3. Try to add component to archived meta (must raise ValidationError)
    meta_archived = MetaModel.objects.create(
        proyecto=proj_a,
        nombre="Meta Archived",
        activo=False,
        created_by=superuser
    )
    comp_archived_meta = ComponenteModel(project=proj_a, meta=meta_archived, name="Archived Meta Comp")
    with pytest.raises(ValidationError) as exc:
        comp_archived_meta.full_clean()
    assert "archived" in str(exc.value).lower() or "archivada" in str(exc.value).lower()

    # 4. Archivar meta con componentes falla
    from modulos.metas.aplicacion.ArchivarMetaUseCase import ArchivarMetaUseCase
    from modulos.metas.infraestructura.DjangoMetaRepository import DjangoMetaRepository
    ComponenteModel.objects.create(project=proj_a, meta=meta_a, name="Comp under A")
    use_case = ArchivarMetaUseCase(DjangoMetaRepository())
    with pytest.raises(ValueError) as exc:
        use_case.ejecutar(str(meta_a.id), superuser.id)
    assert "componentes activos" in str(exc.value)

    # 5. Auditoría
    api_client.force_authenticate(user=superuser)
    
    # 5a. Crear meta -> AuditLog
    initial_log_count = AuditLogModel.objects.count()
    res_create = api_client.post(
        f'/api/proyectos/{proj_a.id}/metas/',
        data={'nombre': 'Meta Audit', 'unidad_medida': 'porcentaje', 'valor_objetivo': 100.0},
        format='json'
    )
    assert res_create.status_code == 201
    created_meta_id = res_create.data['datos']['id']
    
    assert AuditLogModel.objects.count() == initial_log_count + 1
    log_create = AuditLogModel.objects.order_by('-created_at').first()
    assert log_create.accion == 'CREAR'
    assert log_create.modelo_afectado == 'metas'
    assert str(log_create.objeto_id) == str(created_meta_id)

    # 5b. Editar meta -> AuditLog
    res_edit = api_client.patch(
        f'/api/proyectos/{proj_a.id}/metas/{created_meta_id}/',
        data={'nombre': 'Meta Audit Updated'},
        format='json'
    )
    assert res_edit.status_code == 200
    
    assert AuditLogModel.objects.count() == initial_log_count + 2
    log_edit = AuditLogModel.objects.order_by('-created_at').first()
    assert log_edit.accion == 'ACTUALIZAR_PARCIAL'
    assert log_edit.modelo_afectado == 'metas'
    assert str(log_edit.objeto_id) == str(created_meta_id)

    # 5c. Archivar meta -> AuditLog
    res_archive = api_client.post(f'/api/proyectos/{proj_a.id}/metas/{created_meta_id}/archivar/')
    assert res_archive.status_code == 200
    
    assert AuditLogModel.objects.count() == initial_log_count + 3
    log_archive = AuditLogModel.objects.order_by('-created_at').first()
    assert log_archive.accion == 'ARCHIVAR'
    assert log_archive.modelo_afectado == 'metas'
    assert str(log_archive.objeto_id) == str(created_meta_id)


@pytest.mark.django_db
def test_individual_role_administration(api_client, superuser):
    from modulos.acciones.infraestructura.models import AccionModel
    
    # Setup project
    proyecto = ProyectoModel.objects.create(name="Proyecto Juan", created_by=superuser)
    juan = User.objects.create_user(username='juan', password='password123')
    
    meta = MetaModel.objects.create(
        proyecto=proyecto,
        nombre="Meta Juan",
        created_by=superuser
    )
    comp = ComponenteModel.objects.create(project=proyecto, meta=meta, name="Comp Juan")
    accion = AccionModel.objects.create(component=comp, name="Accion Juan")
    
    rol_admin = RolModel.objects.get(codigo='administrador_proyecto')
    rol_carga = RolModel.objects.get(codigo='profesional_carga')
    rol_verif = RolModel.objects.get(codigo='verificador')
    
    api_client.force_authenticate(user=superuser)
    
    # 1. Asignar Administrador de proyecto
    res_post_admin = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'juan', 'rol_id': str(rol_admin.id)},
        format='json'
    )
    assert res_post_admin.status_code == 201
    
    # 2. Asignar Profesional de carga
    res_post_carga = api_client.post(
        f'/api/proyectos/{proyecto.id}/miembros/',
        data={'username': 'juan', 'rol_id': str(rol_carga.id), 'componente_id': str(comp.id), 'accion_id': str(accion.id)},
        format='json'
    )
    assert res_post_carga.status_code == 201
    
    # Obtener el miembro y comprobar que tiene los dos roles
    miembro = ProyectoMiembroModel.objects.get(proyecto=proyecto, usuario=juan)
    res_get = api_client.get(f'/api/proyectos/{proyecto.id}/miembros/')
    assert res_get.status_code == 200
    member_data = res_get.data['datos'][0]
    assert len(member_data['roles']) == 2
    
    # Guardar los asignacion_id de cada uno
    admin_asignacion_id = next(r['id'] for r in member_data['roles'] if r['rol_id'] == str(rol_admin.id))
    carga_asignacion_id = next(r['id'] for r in member_data['roles'] if r['rol_id'] == str(rol_carga.id))
    
    # 3. Editar Profesional de carga (cambiar a Verificador)
    res_patch = api_client.patch(
        f'/api/proyectos/{proyecto.id}/miembros/roles/{carga_asignacion_id}/',
        data={'rol_id': str(rol_verif.id)},
        format='json'
    )
    assert res_patch.status_code == 200
    
    # Comprobar que Administrador de proyecto sigue intacto y Profesional de carga se editó a Verificador
    roles_activos = UsuarioRolModel.objects.filter(usuario=juan, proyecto=proyecto, activo=True)
    assert roles_activos.count() == 2
    assert roles_activos.filter(rol=rol_admin).exists()
    assert roles_activos.filter(rol=rol_verif).exists()
    assert not roles_activos.filter(rol=rol_carga).exists()
    
    # 4. Retirar un rol (Verificador) deja el otro (Administrador de proyecto) intacto
    res_delete_rol = api_client.delete(f'/api/proyectos/{proyecto.id}/miembros/roles/{carga_asignacion_id}/')
    assert res_delete_rol.status_code == 200
    
    roles_activos = UsuarioRolModel.objects.filter(usuario=juan, proyecto=proyecto, activo=True)
    assert roles_activos.count() == 1
    assert roles_activos.filter(rol=rol_admin).exists()
    assert ProyectoMiembroModel.objects.filter(proyecto=proyecto, usuario=juan).exists()
    
    # 5. Retirar el último rol elimina la membresía
    res_delete_last = api_client.delete(f'/api/proyectos/{proyecto.id}/miembros/roles/{admin_asignacion_id}/')
    assert res_delete_last.status_code == 200
    
    assert not UsuarioRolModel.objects.filter(usuario=juan, proyecto=proyecto, activo=True).exists()
    assert not ProyectoMiembroModel.objects.filter(proyecto=proyecto, usuario=juan).exists()


@pytest.mark.django_db
def test_ticket_63_api_security_and_validation(api_client, superuser, operator_user):
    from modulos.metas.infraestructura.models import MetaModel
    from modulos.componentes.infraestructura.models import ComponenteModel
    
    proj_a = ProyectoModel.objects.create(name="Proyecto A", created_by=superuser)
    proj_b = ProyectoModel.objects.create(name="Proyecto B", created_by=superuser)
    
    meta_b = MetaModel.objects.create(
        proyecto=proj_b,
        nombre="Meta B",
        activo=True,
        created_by=superuser
    )
    
    # 1. GET metas sin sesión -> 401
    res_no_session = api_client.get(f'/api/proyectos/{proj_a.id}/metas/')
    assert res_no_session.status_code == 401
    
    # 2. GET metas sin permiso -> 403
    api_client.force_authenticate(user=operator_user)
    res_no_perm = api_client.get(f'/api/proyectos/{proj_a.id}/metas/')
    assert res_no_perm.status_code == 403
    
    # 3. GET metas de proyecto ajeno -> 403
    res_foreign = api_client.get(f'/api/proyectos/{proj_b.id}/metas/')
    assert res_foreign.status_code == 403
    
    # 4. POST componente con meta de otro proyecto -> 400
    rol_admin_proj = RolModel.objects.get(codigo='administrador_proyecto')
    UsuarioRolModel.objects.create(usuario=operator_user, rol=rol_admin_proj, proyecto=proj_a, activo=True)
    ProyectoMiembroModel.objects.create(proyecto=proj_a, usuario=operator_user)
    
    res_comp_mismatch = api_client.post(
        f'/api/componentes/{proj_a.id}/componentes/',
        data={'meta_id': str(meta_b.id), 'name': 'Component mismatch'},
        format='json'
    )
    assert res_comp_mismatch.status_code == 400
    
    # 5. POST acción con proyeccion negativa -> 400
    meta_a = MetaModel.objects.create(
        proyecto=proj_a,
        nombre="Meta A",
        activo=True,
        created_by=superuser
    )
    comp_a = ComponenteModel.objects.create(project=proj_a, meta=meta_a, name="Comp A")
    
    res_action_neg = api_client.post(
        f'/api/acciones/{comp_a.id}/acciones/',
        data={'name': 'Negative action', 'proyeccion_cuantitativa': -5.0},
        format='json'
    )
    assert res_action_neg.status_code == 400
