from django.db import migrations

def upgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    rol = RolModel.objects.filter(codigo='coordinador_proyecto').first()
    if rol:
        perms = PermisoModel.objects.filter(codigo__in=['metas.ver', 'metas.crear', 'metas.editar', 'metas.archivar'])
        for p in perms:
            RolPermisoModel.objects.get_or_create(rol=rol, permiso=p)

def downgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    rol = RolModel.objects.filter(codigo='coordinador_proyecto').first()
    if rol:
        RolPermisoModel.objects.filter(
            rol=rol, 
            permiso__codigo__in=['metas.ver', 'metas.crear', 'metas.editar', 'metas.archivar']
        ).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0018_add_metas_ver_to_coordinador_componente'),
    ]

    operations = [
        migrations.RunPython(upgrade, downgrade),
    ]
