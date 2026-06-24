from django.db import migrations

def update_roles_permissions(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    roles_perms = {
        'superadministrador': [
            'proyectos.ver', 'proyectos.crear', 'proyectos.eliminar',
            'miembros.ver', 'miembros.asignar', 'miembros.actualizar', 'miembros.retirar',
            'componentes.ver', 'acciones.ver', 'evidencias.ver',
            'evidencias.cargar', 'evidencias.verificar', 'auditoria.ver',
            'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.desactivar',
            'roles.ver', 'roles.crear', 'roles.editar', 'roles.desactivar'
        ],
        'administrador_proyecto': [
            'proyectos.ver', 'miembros.ver', 'miembros.asignar', 'miembros.actualizar', 'miembros.retirar',
            'componentes.ver', 'acciones.ver', 'evidencias.ver'
        ],
        'coordinador_proyecto': [
            'proyectos.ver', 'componentes.ver', 'acciones.ver', 'evidencias.ver'
        ],
        'coordinador_componente': [
            'proyectos.ver', 'componentes.ver', 'acciones.ver', 'evidencias.ver'
        ],
        'profesional_carga': [
            'proyectos.ver', 'componentes.ver', 'acciones.ver', 'evidencias.ver', 'evidencias.cargar'
        ],
        'verificador': [
            'proyectos.ver', 'componentes.ver', 'acciones.ver', 'evidencias.ver', 'evidencias.verificar'
        ],
        'direccion_consulta': [
            'proyectos.ver', 'componentes.ver', 'acciones.ver', 'evidencias.ver'
        ],
        'consulta_publica': [
            'proyectos.ver'
        ],
    }

    # Recopilar todos los códigos y crearlos si no existen
    all_codes = set()
    for p_list in roles_perms.values():
        for p in p_list:
            all_codes.add(p)

    for cod in all_codes:
        parts = cod.split('.')
        mod = parts[0] if len(parts) > 1 else 'general'
        PermisoModel.objects.get_or_create(
            codigo=cod,
            defaults={
                'nombre': cod.replace('.', ' ').capitalize(),
                'modulo': mod
            }
        )

    # Limpiar y asignar
    for r_cod, perms in roles_perms.items():
        rol = RolModel.objects.filter(codigo=r_cod).first()
        if rol:
            RolPermisoModel.objects.filter(rol=rol).delete()
            for p_cod in perms:
                perm_obj = PermisoModel.objects.get(codigo=p_cod)
                RolPermisoModel.objects.create(rol=rol, permiso=perm_obj)

def revert_roles_permissions(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0007_usuariorolmodel_unique_active_user_role_per_project'),
    ]

    operations = [
        migrations.RunPython(update_roles_permissions, revert_roles_permissions),
    ]
