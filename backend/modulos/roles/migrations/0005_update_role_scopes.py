# Generated manually to seed roles, permissions, scopes, and migrate existing members

from django.db import migrations
import uuid

def update_seed_roles_and_scopes(apps, schema_editor):
    RolModel = apps.get_model('roles', 'RolModel')

    # Mapeo de alcance para cada uno de los 7 roles del DER
    alcances = {
        'Superadministrador': 'global',
        'Coordinador de proyecto': 'proyecto',
        'Coordinador de componente': 'componente',
        'Profesional de carga': 'accion',
        'Verificador': 'proyecto',
        'Dirección consulta': 'proyecto',
        'Consulta pública': 'proyecto',
    }

    for nom, scope in alcances.items():
        RolModel.objects.filter(nombre=nom).update(tipo_alcance=scope)


def revert_seed(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0004_rolmodel_tipo_alcance'),
    ]

    operations = [
        migrations.RunPython(update_seed_roles_and_scopes, revert_seed),
    ]
