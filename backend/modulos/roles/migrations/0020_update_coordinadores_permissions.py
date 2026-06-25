from django.db import migrations

def upgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    # 1. Coordinador de Componente
    cc_rol = RolModel.objects.filter(codigo='coordinador_componente').first()
    if cc_rol:
        # Quitar metas.editar
        RolPermisoModel.objects.filter(rol=cc_rol, permiso__codigo='metas.editar').delete()
        # Agregar miembros.ver, acciones.crear, acciones.editar
        cc_perms = PermisoModel.objects.filter(codigo__in=['miembros.ver', 'acciones.crear', 'acciones.editar'])
        for p in cc_perms:
            RolPermisoModel.objects.get_or_create(rol=cc_rol, permiso=p)

    # 2. Coordinador de Proyecto
    cp_rol = RolModel.objects.filter(codigo='coordinador_proyecto').first()
    if cp_rol:
        # Agregar miembros.ver, componentes.editar, acciones.crear, acciones.editar
        cp_perms = PermisoModel.objects.filter(codigo__in=[
            'miembros.ver', 'componentes.editar', 'acciones.crear', 'acciones.editar'
        ])
        for p in cp_perms:
            RolPermisoModel.objects.get_or_create(rol=cp_rol, permiso=p)

def downgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    # 1. Coordinador de Componente
    cc_rol = RolModel.objects.filter(codigo='coordinador_componente').first()
    if cc_rol:
        # Agregar de vuelta metas.editar
        meta_edit = PermisoModel.objects.filter(codigo='metas.editar').first()
        if meta_edit:
            RolPermisoModel.objects.get_or_create(rol=cc_rol, permiso=meta_edit)
        # Quitar miembros.ver, acciones.crear, acciones.editar
        RolPermisoModel.objects.filter(
            rol=cc_rol, 
            permiso__codigo__in=['miembros.ver', 'acciones.crear', 'acciones.editar']
        ).delete()

    # 2. Coordinador de Proyecto
    cp_rol = RolModel.objects.filter(codigo='coordinador_proyecto').first()
    if cp_rol:
        # Quitar miembros.ver, componentes.editar, acciones.crear, acciones.editar
        RolPermisoModel.objects.filter(
            rol=cp_rol, 
            permiso__codigo__in=['miembros.ver', 'componentes.editar', 'acciones.crear', 'acciones.editar']
        ).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0019_add_metas_permissions_to_coordinador_proyecto'),
    ]

    operations = [
        migrations.RunPython(upgrade, downgrade),
    ]
