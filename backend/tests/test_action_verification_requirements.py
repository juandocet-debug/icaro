"""
test_action_verification_requirements.py
Ticket 66 — Medición Numérica y Requisitos de Verificación por Acción.
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel, RequisitoVerificacionAccionModel
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
from modulos.miembros.infraestructura.models import ProyectoMiembroModel
from modulos.acciones.dominio.RequisitoVerificacion import RequisitoVerificacion, TIPOS_MIME_PERMITIDOS

VALID_PDF = 'application/pdf'
VALID_JPEG = 'image/jpeg'

PDF_XLSX = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

REQUISITO_VALIDO = {
    'nombre': 'Lista de asistencia',
    'descripcion': 'Registro firmado',
    'obligatorio': True,
    'tipos_archivo_permitidos': PDF_XLSX,
    'min_archivos': 1,
    'max_archivos': 2,
    'orden': 1,
}


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(username='t66_super', email='t66@icaro.pe', password='pass')


@pytest.fixture
def proyecto(db, superuser):
    return ProyectoModel.objects.create(name='P T66', created_by=superuser)


@pytest.fixture
def meta(db, proyecto, superuser):
    return MetaModel.objects.create(proyecto=proyecto, nombre='Meta T66', created_by=superuser)


@pytest.fixture
def comp(db, proyecto, meta):
    return ComponenteModel.objects.create(project=proyecto, meta=meta, name='Comp T66')


# ── Dominio ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_dominio_requisito_valido():
    req = RequisitoVerificacion.crear(
        accion_id='x', nombre='Lista', tipos_archivo_permitidos=[VALID_PDF], min_archivos=1
    )
    assert req.nombre == 'Lista'
    assert req.obligatorio is True
    assert req.min_archivos == 1


@pytest.mark.django_db
def test_dominio_mime_no_permitido():
    with pytest.raises(ValueError, match='no permitido'):
        RequisitoVerificacion.crear(
            accion_id='x', nombre='R',
            tipos_archivo_permitidos=['application/x-executable'],
        )


@pytest.mark.django_db
def test_dominio_obligatorio_sin_min_archivos():
    with pytest.raises(ValueError, match='min_archivos'):
        RequisitoVerificacion.crear(
            accion_id='x', nombre='R',
            tipos_archivo_permitidos=[VALID_PDF],
            obligatorio=True, min_archivos=0,
        )


@pytest.mark.django_db
def test_dominio_max_menor_que_min():
    with pytest.raises(ValueError, match='max_archivos'):
        RequisitoVerificacion.crear(
            accion_id='x', nombre='R',
            tipos_archivo_permitidos=[VALID_PDF],
            min_archivos=3, max_archivos=1,
        )


# ── API: Crear Acción ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_crear_accion_basica(client, superuser, comp):
    client.force_authenticate(user=superuser)
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Taller T66',
        'unidad_medida': 'personas',
        'proyeccion_cuantitativa': 100,
    }, format='json')
    assert res.status_code == 201
    datos = res.data['datos']
    assert datos['name'] == 'Taller T66'
    assert datos['unidad_medida'] == 'personas'
    assert datos['proyeccion_cuantitativa'] == '100.00' or float(datos['proyeccion_cuantitativa']) == 100
    assert datos['avance_porcentaje'] == 0
    assert datos['requisitos_verificacion'] == []


@pytest.mark.django_db
def test_crear_accion_con_requisitos_atomico(client, superuser, comp):
    client.force_authenticate(user=superuser)
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Taller con Req',
        'unidad_medida': 'talleres',
        'proyeccion_cuantitativa': 12,
        'requisitos_verificacion': [REQUISITO_VALIDO],
    }, format='json')
    assert res.status_code == 201
    reqs = res.data['datos']['requisitos_verificacion']
    assert len(reqs) == 1
    assert reqs[0]['nombre'] == 'Lista de asistencia'


@pytest.mark.django_db
def test_requisito_invalido_no_crea_accion(client, superuser, comp):
    count_before = AccionModel.objects.count()
    client.force_authenticate(user=superuser)
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Falla',
        'unidad_medida': 'u',
        'proyeccion_cuantitativa': 5,
        'requisitos_verificacion': [{
            'nombre': 'R',
            'tipos_archivo_permitidos': ['application/x-badtype'],
            'min_archivos': 1,
        }],
    }, format='json')
    assert res.status_code == 400
    assert AccionModel.objects.count() == count_before


@pytest.mark.django_db
def test_proyeccion_negativa_retorna_400(client, superuser, comp):
    client.force_authenticate(user=superuser)
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Neg', 'unidad_medida': 'u', 'proyeccion_cuantitativa': -5,
    }, format='json')
    assert res.status_code == 400


@pytest.mark.django_db
def test_ejecucion_mayor_proyeccion_retorna_400(client, superuser, comp):
    client.force_authenticate(user=superuser)
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Excede', 'unidad_medida': 'u',
        'proyeccion_cuantitativa': 10, 'ejecucion_acumulada': 15,
    }, format='json')
    assert res.status_code == 400


# ── API: Requisitos GET/PUT ───────────────────────────────────────────────────

@pytest.mark.django_db
def test_get_requisitos(client, superuser, comp):
    client.force_authenticate(user=superuser)
    # Crear acción
    r_create = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'A', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 10,
        'requisitos_verificacion': [REQUISITO_VALIDO],
    }, format='json')
    accion_id = r_create.data['datos']['id']

    res = client.get(f'/api/acciones/{comp.id}/acciones/{accion_id}/requisitos/')
    assert res.status_code == 200
    assert len(res.data['datos']) == 1


@pytest.mark.django_db
def test_put_requisitos_reemplaza_atomicamente(client, superuser, comp):
    client.force_authenticate(user=superuser)
    r_create = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'A2', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 10,
        'requisitos_verificacion': [REQUISITO_VALIDO],
    }, format='json')
    accion_id = r_create.data['datos']['id']

    nuevo_req = {
        'nombre': 'Foto',
        'obligatorio': True,
        'tipos_archivo_permitidos': ['image/jpeg', 'image/png'],
        'min_archivos': 3,
        'max_archivos': 10,
        'orden': 1,
    }
    res = client.put(
        f'/api/acciones/{comp.id}/acciones/{accion_id}/requisitos/',
        [nuevo_req],
        format='json',
    )
    assert res.status_code == 200
    assert len(res.data['datos']) == 1
    assert res.data['datos'][0]['nombre'] == 'Foto'
    # Verificar que el antiguo fue eliminado
    assert not RequisitoVerificacionAccionModel.objects.filter(
        accion_id=accion_id, nombre='Lista de asistencia'
    ).exists()


# ── API: Permisos y seguridad ─────────────────────────────────────────────────

@pytest.mark.django_db
def test_sin_sesion_retorna_401(client, comp):
    res = client.get(f'/api/acciones/{comp.id}/acciones/')
    assert res.status_code == 401


@pytest.mark.django_db
def test_usuario_sin_permiso_crear_retorna_403(client, db, comp, proyecto):
    user = User.objects.create_user(username='t66_sinperm', password='pass')
    rol = RolModel.objects.get(codigo='coordinador_proyecto')
    UsuarioRolModel.objects.create(usuario=user, proyecto=proyecto, rol=rol, activo=True)
    ProyectoMiembroModel.objects.get_or_create(proyecto=proyecto, usuario=user)

    client.force_authenticate(user=user)
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'X', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 5,
    }, format='json')
    assert res.status_code == 403


@pytest.mark.django_db
def test_idor_componente_otro_proyecto(client, superuser, db):
    p_a = ProyectoModel.objects.create(name='PA', created_by=superuser)
    p_b = ProyectoModel.objects.create(name='PB', created_by=superuser)
    meta_b = MetaModel.objects.create(proyecto=p_b, nombre='M', created_by=superuser)
    comp_b = ComponenteModel.objects.create(project=p_b, meta=meta_b, name='C')

    user = User.objects.create_user(username='t66_idor', password='pass')
    rol = RolModel.objects.get(codigo='administrador_proyecto')
    UsuarioRolModel.objects.create(usuario=user, proyecto=p_a, rol=rol, activo=True)
    ProyectoMiembroModel.objects.get_or_create(proyecto=p_a, usuario=user)

    client.force_authenticate(user=user)
    # Intenta crear acción en comp_b (proyecto B) sin pertenecer a él
    res = client.post(f'/api/acciones/{comp_b.id}/acciones/', {
        'name': 'X', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 5,
    }, format='json')
    assert res.status_code in (403, 404)


@pytest.mark.django_db
def test_avance_calculado_no_manual(client, superuser, comp):
    client.force_authenticate(user=superuser)
    # Crear acción con ejecución
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Avance', 'unidad_medida': 'personas',
        'proyeccion_cuantitativa': 200, 'ejecucion_acumulada': 100,
    }, format='json')
    assert res.status_code == 201
    pct = res.data['datos']['avance_porcentaje']
    assert pct == 50.0


@pytest.mark.django_db
def test_mime_no_permitido_en_requisito_retorna_error(client, superuser, comp):
    client.force_authenticate(user=superuser)
    res = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'X', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 5,
        'requisitos_verificacion': [{
            'nombre': 'R',
            'tipos_archivo_permitidos': ['application/x-executable', 'text/html'],
            'min_archivos': 1,
        }],
    }, format='json')
    assert res.status_code == 400
    assert 'no permitido' in res.data.get('error', '').lower()


# ── Subida real de archivos ────────────────────────────────────────────────────

STORAGE_PATCH = 'modulos.uploads.infraestructura.UploadController.default_storage'


def _pdf_bytes():
    return b'%PDF-1.4 fake pdf content for testing purposes only'


def _jpeg_bytes():
    return b'\xff\xd8\xff\xe0\x00\x10JFIF fake jpeg content'


def _exe_bytes():
    return b'MZ fake exe header content'


@pytest.mark.django_db
def test_subir_pdf_valido(client, superuser, comp):
    from unittest.mock import patch, MagicMock
    client.force_authenticate(user=superuser)
    r = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Acc PDF', 'unidad_medida': 'talleres', 'proyeccion_cuantitativa': 5,
        'requisitos_verificacion': [{
            'nombre': 'Lista', 'obligatorio': True,
            'tipos_archivo_permitidos': ['application/pdf'],
            'min_archivos': 1, 'orden': 0,
        }],
    }, format='json')
    assert r.status_code == 201
    accion_id = r.data['datos']['id']
    requisito_id = r.data['datos']['requisitos_verificacion'][0]['id']

    from django.core.files.uploadedfile import SimpleUploadedFile
    archivo = SimpleUploadedFile('lista.pdf', _pdf_bytes(), content_type='application/pdf')

    mock_ds = MagicMock()
    mock_ds.save.return_value = 'evidencias/test/doc.pdf'
    mock_ds.url.return_value = '/media/evidencias/test/doc.pdf'

    with patch(STORAGE_PATCH, mock_ds):
        res = client.post(
            f'/api/uploads/{accion_id}/uploads/',
            data={'archivo': archivo, 'requisito_id': str(requisito_id)},
            format='multipart',
        )
    assert res.status_code == 201, res.data
    assert res.data['datos']['file_type'] == 'application/pdf'


@pytest.mark.django_db
def test_subir_ejecutable_rechazado(client, superuser, comp):
    client.force_authenticate(user=superuser)
    r = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Acc EXE', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 5,
    }, format='json')
    accion_id = r.data['datos']['id']

    from django.core.files.uploadedfile import SimpleUploadedFile
    archivo = SimpleUploadedFile('malware.exe', _exe_bytes(), content_type='application/octet-stream')
    res = client.post(
        f'/api/uploads/{accion_id}/uploads/',
        data={'archivo': archivo},
        format='multipart',
    )
    assert res.status_code == 400
    assert 'extensión' in res.data.get('error', '').lower() or 'no reconocido' in res.data.get('error', '').lower()


@pytest.mark.django_db
def test_subir_mime_no_coincide_con_requisito(client, superuser, comp):
    """Subir JPEG a un requisito que solo acepta PDF → 400."""
    client.force_authenticate(user=superuser)
    r = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Acc Mime', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 5,
        'requisitos_verificacion': [{
            'nombre': 'Solo PDF', 'obligatorio': True,
            'tipos_archivo_permitidos': ['application/pdf'],
            'min_archivos': 1, 'orden': 0,
        }],
    }, format='json')
    accion_id = r.data['datos']['id']
    requisito_id = r.data['datos']['requisitos_verificacion'][0]['id']

    from django.core.files.uploadedfile import SimpleUploadedFile
    archivo = SimpleUploadedFile('foto.jpg', _jpeg_bytes(), content_type='image/jpeg')
    res = client.post(
        f'/api/uploads/{accion_id}/uploads/',
        data={'archivo': archivo, 'requisito_id': str(requisito_id)},
        format='multipart',
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_subir_sin_archivo_retorna_400(client, superuser, comp):
    client.force_authenticate(user=superuser)
    r = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'A', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 5,
    }, format='json')
    accion_id = r.data['datos']['id']
    res = client.post(f'/api/uploads/{accion_id}/uploads/', {}, format='json')
    assert res.status_code == 400
    assert 'archivo' in res.data.get('error', '').lower()


@pytest.mark.django_db
def test_max_archivos_excedido_retorna_400(client, superuser, comp):
    """Un requisito con max_archivos=1 rechaza el segundo archivo."""
    from unittest.mock import patch, MagicMock
    client.force_authenticate(user=superuser)
    r = client.post(f'/api/acciones/{comp.id}/acciones/', {
        'name': 'Acc Max', 'unidad_medida': 'u', 'proyeccion_cuantitativa': 5,
        'requisitos_verificacion': [{
            'nombre': 'Max 1', 'obligatorio': True,
            'tipos_archivo_permitidos': ['application/pdf'],
            'min_archivos': 1, 'max_archivos': 1, 'orden': 0,
        }],
    }, format='json')
    assert r.status_code == 201
    accion_id = r.data['datos']['id']
    requisito_id = r.data['datos']['requisitos_verificacion'][0]['id']

    from django.core.files.uploadedfile import SimpleUploadedFile

    mock_ds = MagicMock()
    mock_ds.save.return_value = 'evidencias/test/doc.pdf'
    mock_ds.url.return_value = '/media/evidencias/test/doc.pdf'

    # Primer archivo → OK
    with patch(STORAGE_PATCH, mock_ds):
        a1 = SimpleUploadedFile('doc1.pdf', _pdf_bytes(), content_type='application/pdf')
        res1 = client.post(f'/api/uploads/{accion_id}/uploads/',
                           data={'archivo': a1, 'requisito_id': str(requisito_id)}, format='multipart')
    assert res1.status_code == 201

    # Segundo archivo → debe rechazar (max=1, ya hay 1)
    a2 = SimpleUploadedFile('doc2.pdf', _pdf_bytes(), content_type='application/pdf')
    res2 = client.post(f'/api/uploads/{accion_id}/uploads/',
                       data={'archivo': a2, 'requisito_id': str(requisito_id)}, format='multipart')
    assert res2.status_code == 400


@pytest.mark.django_db
def test_sin_permiso_evidencias_subir_retorna_403(client, db, comp, proyecto):
    user = User.objects.create_user(username='t66_noevidencia', password='pass')
    # Rol que solo puede ver, sin evidencias.subir
    rol = RolModel.objects.get(codigo='coordinador_proyecto')
    UsuarioRolModel.objects.create(usuario=user, proyecto=proyecto, rol=rol, activo=True)
    ProyectoMiembroModel.objects.get_or_create(proyecto=proyecto, usuario=user)

    from modulos.acciones.infraestructura.models import AccionModel
    accion = AccionModel.objects.create(component=comp, name='A', proyeccion_cuantitativa=5, unidad_medida='u')

    from django.core.files.uploadedfile import SimpleUploadedFile
    client.force_authenticate(user=user)
    archivo = SimpleUploadedFile('doc.pdf', _pdf_bytes(), content_type='application/pdf')
    res = client.post(f'/api/uploads/{accion.id}/uploads/',
                      data={'archivo': archivo}, format='multipart')
    assert res.status_code == 403


@pytest.mark.django_db
def test_put_accion_requiere_acciones_editar(client, db, comp, proyecto):
    """Un coordinador de proyecto (sin acciones.editar) recibe 403 al editar."""
    user = User.objects.create_user(username='t66_edit', password='pass')
    rol = RolModel.objects.get(codigo='coordinador_proyecto')
    UsuarioRolModel.objects.create(usuario=user, proyecto=proyecto, rol=rol, activo=True)
    ProyectoMiembroModel.objects.get_or_create(proyecto=proyecto, usuario=user)

    from modulos.acciones.infraestructura.models import AccionModel
    accion = AccionModel.objects.create(component=comp, name='A', proyeccion_cuantitativa=5, unidad_medida='u')

    client.force_authenticate(user=user)
    res = client.put(f'/api/acciones/{comp.id}/acciones/{accion.id}/',
                     {'name': 'Editada', 'proyeccion_cuantitativa': 5}, format='json')
    assert res.status_code == 403


@pytest.mark.django_db
def test_delete_accion_requiere_acciones_eliminar(client, db, comp, proyecto):
    user = User.objects.create_user(username='t66_del', password='pass')
    rol = RolModel.objects.get(codigo='coordinador_proyecto')
    UsuarioRolModel.objects.create(usuario=user, proyecto=proyecto, rol=rol, activo=True)
    ProyectoMiembroModel.objects.get_or_create(proyecto=proyecto, usuario=user)

    from modulos.acciones.infraestructura.models import AccionModel
    accion = AccionModel.objects.create(component=comp, name='A', proyeccion_cuantitativa=5, unidad_medida='u')

    client.force_authenticate(user=user)
    res = client.delete(f'/api/acciones/{comp.id}/acciones/{accion.id}/')
    assert res.status_code == 403
