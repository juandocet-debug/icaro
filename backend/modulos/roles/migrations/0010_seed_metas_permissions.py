from django.db import migrations

def seed_metas_permissions_and_roles(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    # 1. Crear los permisos de metas
    metas_perms = [
        ('metas.ver', 'Ver Metas', 'Metas', 'Permite visualizar metas en sus proyectos asignados.'),
        ('metas.crear', 'Crear Metas', 'Metas', 'Permite crear metas en sus proyectos asignados.'),
        ('metas.editar', 'Editar Metas', 'Metas', 'Permite editar metas en sus proyectos asignados.'),
        ('metas.archivar', 'Archivar Metas', 'Metas', 'Permite archivar metas en sus proyectos asignados.'),
    ]

    perm_objs = []
    for cod, nom, mod, desc in metas_perms:
        p, _ = PermisoModel.objects.get_or_create(
            codigo=cod,
            defaults={'nombre': nom, 'modulo': mod, 'descripcion': desc}
        )
        perm_objs.append(p)

    # 2. Crear rol Coordinador general si no existe
    rol_coord_gen, _ = RolModel.objects.get_or_create(
        codigo='coordinador_general',
        defaults={
            'nombre': 'Coordinador general',
            'descripcion': 'Puede consultar, crear, editar y archivar metas únicamente en sus proyectos asignados.',
            'es_sistema': True,
            'activo': True,
            'tipo_alcance': 'proyecto'
        }
    )

    # Asignar los nuevos permisos de metas a los roles correspondientes
    roles_para_metas = ['administrador_proyecto', 'coordinador_general']
    for r_cod in roles_para_metas:
        rol_obj = RolModel.objects.filter(codigo=r_cod).first()
        if rol_obj:
            for p in perm_objs:
                RolPermisoModel.objects.get_or_create(rol=rol_obj, permiso=p)

    # También superadministrador recibe acceso a estos permisos
    superadmin = RolModel.objects.filter(codigo='superadministrador').first()
    if superadmin:
        for p in perm_objs:
            RolPermisoModel.objects.get_or_create(rol=superadmin, permiso=p)

def revert_metas_permissions_and_roles(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0009_remove_usuariorolmodel_unique_active_user_role_per_project_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_metas_permissions_and_roles, revert_metas_permissions_and_roles),
    ]
