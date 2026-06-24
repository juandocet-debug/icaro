from django.db import migrations


def seed(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    perm, _ = PermisoModel.objects.get_or_create(
        codigo='usuarios.desactivar',
        defaults={'nombre': 'Desactivar Usuarios', 'modulo': 'Usuarios',
                  'descripcion': 'Permite activar o desactivar cuentas de usuario.'},
    )
    for codigo in ('administrador_proyecto', 'coordinador_general', 'superadministrador'):
        rol = RolModel.objects.filter(codigo=codigo).first()
        if rol:
            RolPermisoModel.objects.get_or_create(rol=rol, permiso=perm)


def revert(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [('roles', '0014_seed_editar_eliminar_metas_componentes')]
    operations = [migrations.RunPython(seed, revert)]
