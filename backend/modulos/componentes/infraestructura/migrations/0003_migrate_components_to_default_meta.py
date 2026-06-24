from django.db import migrations

def migrate_components(apps, schema_editor):
    ProyectoModel = apps.get_model('proyectos', 'ProyectoModel')
    ComponenteModel = apps.get_model('componentes', 'ComponenteModel')
    MetaModel = apps.get_model('metas', 'MetaModel')
    User = apps.get_model('auth', 'User')

    fallback_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

    for project in ProyectoModel.objects.all():
        components = ComponenteModel.objects.filter(project=project)
        if components.exists():
            creator = project.created_by or fallback_user
            meta, created = MetaModel.objects.get_or_create(
                proyecto=project,
                nombre="Sin clasificar - migración inicial",
                defaults={
                    'unidad_medida': 'unidades',
                    'valor_objetivo': 0.0,
                    'activo': True,
                    'created_by': creator
                }
            )
            components.update(meta=meta)

def reverse_migrate_components(apps, schema_editor):
    ComponenteModel = apps.get_model('componentes', 'ComponenteModel')
    MetaModel = apps.get_model('metas', 'MetaModel')
    
    ComponenteModel.objects.all().update(meta=None)
    MetaModel.objects.filter(nombre="Sin clasificar - migración inicial").delete()

class Migration(migrations.Migration):

    dependencies = [
        ('componentes', '0002_componentemodel_meta'),
        ('metas', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_components, reverse_migrate_components),
    ]
