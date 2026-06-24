# Generated manually to seed roles, permissions, and migrate existing members

from django.db import migrations
import uuid

def seed_roles_and_permissions(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    PermisoModel = apps.get_model('roles', 'PermisoModel')
    RolPermisoModel = apps.get_model('roles', 'RolPermisoModel')
    UsuarioRolModel = apps.get_model('roles', 'UsuarioRolModel')
    ProyectoMiembroModel = apps.get_model('miembros', 'ProyectoMiembroModel')

    # 1. Catálogo inicial de permisos
    permisos_data = [
        # Proyectos
        ('proj_ver', 'Ver Proyectos', 'Proyectos', 'Permite visualizar la lista de proyectos y sus detalles básicos.'),
        ('proj_crear', 'Crear Proyectos', 'Proyectos', 'Permite crear nuevos proyectos en la plataforma.'),
        ('proj_editar', 'Editar Proyectos', 'Proyectos', 'Permite actualizar la información de los proyectos.'),
        ('proj_eliminar', 'Eliminar Proyectos', 'Proyectos', 'Permite eliminar proyectos de la plataforma.'),
        # Componentes y Acciones
        ('comp_gestionar', 'Gestionar Componentes', 'Componentes y acciones', 'Permite crear, editar y eliminar componentes.'),
        ('acc_gestionar', 'Gestionar Acciones', 'Componentes y acciones', 'Permite crear, editar y eliminar acciones.'),
        # Evidencias
        ('evid_subir', 'Subir Evidencias', 'Evidencias', 'Permite cargar documentos y evidencias.'),
        ('evid_validar', 'Validar Evidencias', 'Evidencias', 'Permite verificar y validar las evidencias cargadas.'),
        ('evid_descargar', 'Descargar Evidencias', 'Evidencias', 'Permite descargar los archivos de evidencias.'),
        # Verificación
        ('verif_ejecutar', 'Ejecutar Verificación', 'Verificación', 'Permite realizar labores de verificación de hitos.'),
        # Usuarios
        ('usr_gestionar', 'Gestionar Usuarios', 'Usuarios', 'Permite crear, activar, desactivar y administrar usuarios.'),
        ('rol_gestionar', 'Gestionar Roles y Permisos', 'Usuarios', 'Permite administrar roles y configurar permisos.'),
        # Consulta
        ('cons_general', 'Consulta General', 'Consulta', 'Acceso de lectura a reportes y tableros generales.'),
    ]

    permisos_dict = {}
    for cod, nom, mod, desc in permisos_data:
        p, _ = PermisoModel.objects.get_or_create(
            codigo=cod,
            defaults={'nombre': nom, 'modulo': mod, 'descripcion': desc}
        )
        permisos_dict[cod] = p

    # 2. Roles del DER obligatorios (es_sistema=True)
    roles_sistema = [
        ('Superadministrador', 'Acceso total y sin restricciones a todos los módulos y configuraciones del sistema.', [
            'proj_ver', 'proj_crear', 'proj_editar', 'proj_eliminar',
            'comp_gestionar', 'acc_gestionar', 'evid_subir', 'evid_validar',
            'evid_descargar', 'verif_ejecutar', 'usr_gestionar', 'rol_gestionar', 'cons_general'
        ]),
        ('Coordinador de proyecto', 'Responsable de la gestión del proyecto, asignación de miembros y control general.', [
            'proj_ver', 'proj_editar', 'comp_gestionar', 'acc_gestionar',
            'evid_subir', 'evid_validar', 'evid_descargar', 'cons_general'
        ]),
        ('Coordinador de componente', 'Encargado de la supervisión y avances de un componente específico.', [
            'proj_ver', 'comp_gestionar', 'acc_gestionar', 'evid_subir', 'evid_descargar', 'cons_general'
        ]),
        ('Profesional de carga', 'Encargado de subir las evidencias y reportar el progreso de las acciones.', [
            'proj_ver', 'evid_subir', 'evid_descargar'
        ]),
        ('Verificador', 'Auditor externo encargado de validar la veracidad y calidad de las evidencias.', [
            'proj_ver', 'evid_validar', 'evid_descargar', 'verif_ejecutar'
        ]),
        ('Dirección consulta', 'Acceso de lectura gerencial a todo el proyecto sin permisos de edición.', [
            'proj_ver', 'evid_descargar', 'cons_general'
        ]),
        ('Consulta pública', 'Acceso limitado de solo lectura a información pública autorizada.', [
            'proj_ver'
        ]),
    ]

    roles_dict = {}
    for nom, desc, perms in roles_sistema:
        r, _ = RolModel.objects.get_or_create(
            nombre=nom,
            defaults={'descripcion': desc, 'es_sistema': True, 'activo': True}
        )
        roles_dict[nom] = r
        # Asignar permisos al rol
        RolPermisoModel.objects.filter(rol=r).delete()
        for p_cod in perms:
            RolPermisoModel.objects.create(rol=r, permiso=permisos_dict[p_cod])

    # 3. Migrar roles de miembros antiguos a UsuarioRolModel
    # Mapeo: director/coordinador -> Coordinador de proyecto
    # tecnico -> Profesional de carga
    # analista -> Verificador
    # observador -> Dirección consulta
    mapeo_roles = {
        'director': 'Coordinador de proyecto',
        'coordinador': 'Coordinador de proyecto',
        'tecnico': 'Profesional de carga',
        'analista': 'Verificador',
        'observador': 'Dirección consulta',
    }

    miembros = ProyectoMiembroModel.objects.all()
    for m in miembros:
        rol_nombre_destino = mapeo_roles.get(m.rol, 'Dirección consulta')
        rol_dest = roles_dict[rol_nombre_destino]
        # Crear asignación UsuarioRolModel si no existe
        UsuarioRolModel.objects.get_or_create(
            usuario_id=m.usuario_id,
            rol=rol_dest,
            proyecto_id=m.proyecto_id,
            defaults={'id': uuid.uuid4()}
        )


def revert_seed(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_roles_and_permissions, revert_seed),
    ]
