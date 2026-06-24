from django.db import migrations

def seed(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    nuevos = [
        ('metas.editar',   'Editar Metas',   'Metas', 'Permite editar metas.'),
        ('metas.eliminar', 'Eliminar Metas',  'Metas', 'Permite eliminar metas.'),
        ('componentes.editar',   'Editar Componentes',   'Componentes', 'Permite editar componentes.'),
        ('componentes.eliminar', 'Eliminar Componentes',  'Componentes', 'Permite eliminar componentes.'),
    ]
    perm_objs = []
    for cod, nom, mod, desc in nuevos:
        p, _ = PermisoModel.objects.get_or_create(
            codigo=cod, defaults={'nombre': nom, 'modulo': mod, 'descripcion': desc}
        )
        perm_objs.append((cod, p))

    roles_gestion = ['administrador_proyecto', 'coordinador_general', 'superadministrador']

    for cod, p in perm_objs:
        for r_cod in roles_gestion:
            rol = RolModel.objects.filter(codigo=r_cod).first()
            if rol:
                RolPermisoModel.objects.get_or_create(rol=rol, permiso=p)

def revert(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [('roles', '0013_seed_evidencias_permisos')]
    operations = [migrations.RunPython(seed, revert)]
