from django.db import migrations


def seed(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    nuevos = [
        ('evidencias.ver',       'Ver Evidencias',       'Evidencias', 'Permite ver evidencias de una acción.'),
        ('evidencias.eliminar',  'Eliminar Evidencias',  'Evidencias', 'Permite eliminar evidencias.'),
        ('evidencias.verificar', 'Verificar Evidencias', 'Evidencias', 'Permite aprobar o rechazar evidencias.'),
    ]
    perm_objs = []
    for cod, nom, mod, desc in nuevos:
        p, _ = PermisoModel.objects.get_or_create(
            codigo=cod, defaults={'nombre': nom, 'modulo': mod, 'descripcion': desc}
        )
        perm_objs.append((cod, p))

    roles_gestion = ['administrador_proyecto', 'coordinador_general', 'superadministrador']
    roles_ver = roles_gestion + ['profesional_carga']

    for cod, p in perm_objs:
        roles = roles_ver if cod == 'evidencias.ver' else roles_gestion
        for r_cod in roles:
            rol = RolModel.objects.filter(codigo=r_cod).first()
            if rol:
                RolPermisoModel.objects.get_or_create(rol=rol, permiso=p)


def revert(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [('roles', '0012_seed_acciones_editar_eliminar')]
    operations = [migrations.RunPython(seed, revert)]
