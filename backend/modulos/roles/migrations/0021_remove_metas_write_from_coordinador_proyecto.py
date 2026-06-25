from django.db import migrations

def upgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    cp_rol = RolModel.objects.filter(codigo='coordinador_proyecto').first()
    if cp_rol:
        # Remover permisos de escritura/creación/archivado de metas para coordinador de proyecto
        RolPermisoModel.objects.filter(
            rol=cp_rol, 
            permiso__codigo__in=['metas.crear', 'metas.editar', 'metas.archivar', 'metas.eliminar']
        ).delete()

def downgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    cp_rol = RolModel.objects.filter(codigo='coordinador_proyecto').first()
    if cp_rol:
        # Volver a agregar en caso de downgrade
        perms = PermisoModel.objects.filter(codigo__in=['metas.ver', 'metas.crear', 'metas.editar', 'metas.archivar'])
        for p in perms:
            RolPermisoModel.objects.get_or_create(rol=cp_rol, permiso=p)

class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0020_update_coordinadores_permissions'),
    ]

    operations = [
        migrations.RunPython(upgrade, downgrade),
    ]
