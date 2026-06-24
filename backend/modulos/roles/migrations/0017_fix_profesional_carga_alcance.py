from django.db import migrations


def upgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    # Cambiar "Profesional de carga" de alcance 'accion' a 'proyecto'
    # para que al asignarse en ProyectoEquipo no pida seleccionar una acción
    # y el usuario aparezca correctamente en el selector de responsables del canvas.
    updated = RolModel.objects.filter(
        codigo='profesional_carga',
        tipo_alcance='accion',
    ).update(tipo_alcance='proyecto')

    # Limpiar asignaciones de rol con accion_id en el scope de este rol,
    # reasignándolas al nivel de proyecto (accion_id → null).
    if updated:
        UsuarioRolModel = apps.get_model('roles', 'UsuarioRolModel')
        UsuarioRolModel.objects.filter(
            rol__codigo='profesional_carga',
            accion_id__isnull=False,
        ).update(accion_id=None, componente_id=None)


def downgrade(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')
    RolModel.objects.filter(codigo='profesional_carga').update(tipo_alcance='accion')


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0016_seed_responsibles_permissions'),
    ]

    operations = [
        migrations.RunPython(upgrade, downgrade),
    ]
