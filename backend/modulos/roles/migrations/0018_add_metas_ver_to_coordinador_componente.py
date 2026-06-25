from django.db import migrations

def upgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    # Obtener el rol coordinador_componente
    rol = RolModel.objects.filter(codigo='coordinador_componente').first()
    if rol:
        # Obtener los permisos metas.ver y metas.editar
        perms = PermisoModel.objects.filter(codigo__in=['metas.ver', 'metas.editar'])
        for p in perms:
            RolPermisoModel.objects.get_or_create(rol=rol, permiso=p)

def downgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    rol = RolModel.objects.filter(codigo='coordinador_componente').first()
    if rol:
        RolPermisoModel.objects.filter(
            rol=rol, 
            permiso__codigo__in=['metas.ver', 'metas.editar']
        ).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0017_fix_profesional_carga_alcance'),
    ]

    operations = [
        migrations.RunPython(upgrade, downgrade),
    ]
