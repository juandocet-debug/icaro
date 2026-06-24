from django.db import migrations


def seed(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    nuevos = [
        ('componentes.crear', 'Crear Componentes', 'Componentes',
         'Permite crear componentes bajo las metas de sus proyectos asignados.'),
        ('acciones.crear', 'Crear Acciones', 'Acciones',
         'Permite crear acciones bajo los componentes de sus proyectos asignados.'),
    ]

    perm_objs = []
    for cod, nom, mod, desc in nuevos:
        p, _ = PermisoModel.objects.get_or_create(
            codigo=cod,
            defaults={'nombre': nom, 'modulo': mod, 'descripcion': desc}
        )
        perm_objs.append(p)

    # Roles que pueden crear estructura (mismos que pueden crear metas)
    codigos_roles = ['administrador_proyecto', 'coordinador_general', 'superadministrador']
    for r_cod in codigos_roles:
        rol = RolModel.objects.filter(codigo=r_cod).first()
        if rol:
            for p in perm_objs:
                RolPermisoModel.objects.get_or_create(rol=rol, permiso=p)


def revert(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0010_seed_metas_permissions'),
    ]

    operations = [
        migrations.RunPython(seed, revert),
    ]
