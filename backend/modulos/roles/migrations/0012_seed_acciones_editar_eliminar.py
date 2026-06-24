from django.db import migrations


def seed(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    nuevos = [
        ('acciones.editar',   'Editar Acciones',   'Acciones', 'Permite editar acciones y sus requisitos.'),
        ('acciones.eliminar', 'Eliminar Acciones',  'Acciones', 'Permite eliminar acciones.'),
        ('evidencias.subir',  'Subir Evidencias',   'Evidencias', 'Permite cargar archivos de evidencia.'),
    ]
    perm_objs = []
    for cod, nom, mod, desc in nuevos:
        p, _ = PermisoModel.objects.get_or_create(
            codigo=cod, defaults={'nombre': nom, 'modulo': mod, 'descripcion': desc}
        )
        perm_objs.append((cod, p))

    # Roles que reciben acciones.editar y acciones.eliminar
    roles_gestion = ['administrador_proyecto', 'coordinador_general', 'superadministrador']
    # Solo evidencias.subir para profesional_carga también
    roles_subir = roles_gestion + ['profesional_carga']

    for cod, p in perm_objs:
        roles = roles_subir if cod == 'evidencias.subir' else roles_gestion
        for r_cod in roles:
            rol = RolModel.objects.filter(codigo=r_cod).first()
            if rol:
                RolPermisoModel.objects.get_or_create(rol=rol, permiso=p)


def revert(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [('roles', '0011_seed_componentes_acciones_permisos')]
    operations = [migrations.RunPython(seed, revert)]
