from django.db import migrations


def seed_permissions(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')

    # 1. Crear los 3 permisos que son realmente nuevos
    permisos_data = [
        ('acciones.asignar_responsables', 'Asignar Responsables a Acciones', 'acciones', 'Permite asignar responsables y personal de apoyo a actividades/acciones.'),
        ('acciones.ejecutar', 'Registrar Ejecución de Acciones', 'acciones', 'Permite reportar avance numérico de ejecución en acciones asignadas.'),
        ('acciones.ver_mis_asignadas', 'Ver Mis Actividades Asignadas', 'acciones', 'Permite visualizar el listado de actividades y acciones asignadas en su vista personal.'),
    ]

    permisos_dict = {}
    for cod, nom, mod, desc in permisos_data:
        p, _ = PermisoModel.objects.get_or_create(
            codigo=cod,
            defaults={'nombre': nom, 'modulo': mod, 'descripcion': desc}
        )
        permisos_dict[cod] = p

    # 2. Asignar los permisos a los roles según la matriz
    asignaciones = {
        # Superadministrador
        'superadministrador': ['acciones.asignar_responsables', 'acciones.ejecutar', 'acciones.ver_mis_asignadas'],
        # Administrador de proyecto
        'administrador_proyecto': ['acciones.asignar_responsables', 'acciones.ejecutar', 'acciones.ver_mis_asignadas'],
        # Coordinador general / Coordinador de proyecto
        'coordinador_general': ['acciones.asignar_responsables', 'acciones.ejecutar', 'acciones.ver_mis_asignadas'],
        'coordinador_proyecto': ['acciones.asignar_responsables', 'acciones.ejecutar', 'acciones.ver_mis_asignadas'],
        # Coordinador de componente
        'coordinador_componente': ['acciones.ejecutar', 'acciones.ver_mis_asignadas'],
        # Profesional de carga
        'profesional_carga': ['acciones.ejecutar', 'acciones.ver_mis_asignadas'],
        # Analista / Verificador
        'verificador': ['acciones.ver_mis_asignadas'],
        # Observador / Dirección consulta
        'direccion_consulta': ['acciones.ver_mis_asignadas'],
    }

    for rol_codigo, perms in asignaciones.items():
        rol = RolModel.objects.filter(codigo=rol_codigo).first()
        if rol:
            for p_cod in perms:
                perm_obj = permisos_dict[p_cod]
                RolPermisoModel.objects.get_or_create(rol=rol, permiso=perm_obj)


def revert_permissions(apps, schema_editor):
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    PermisoModel.objects.filter(codigo__in=[
        'acciones.asignar_responsables',
        'acciones.ejecutar',
        'acciones.ver_mis_asignadas'
    ]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('roles', '0015_seed_admin_desactivar_usuarios'),
    ]
    operations = [
        migrations.RunPython(seed_permissions, revert_permissions),
    ]
