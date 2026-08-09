from django.db import migrations, models


def registrar_codigos_existentes(apps, schema_editor):
    Evidencia = apps.get_model('evidencias', 'EvidenciaActividadModel')
    Registro = apps.get_model('evidencias', 'CodigoDoxaRegistradoModel')
    codigos = {
        str(codigo).strip().upper()
        for codigo in Evidencia.objects.exclude(codigo_doxa__isnull=True)
        .exclude(codigo_doxa='')
        .values_list('codigo_doxa', flat=True)
    }
    Registro.objects.bulk_create(
        [Registro(codigo=codigo) for codigo in codigos],
        ignore_conflicts=True,
    )


class Migration(migrations.Migration):
    dependencies = [('evidencias', '0007_evidencia_codigo_doxa')]

    operations = [
        migrations.CreateModel(
            name='CodigoDoxaRegistradoModel',
            fields=[
                ('codigo', models.CharField(max_length=16, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'codigos_doxa_registrados'},
        ),
        migrations.RunPython(registrar_codigos_existentes, migrations.RunPython.noop),
    ]
