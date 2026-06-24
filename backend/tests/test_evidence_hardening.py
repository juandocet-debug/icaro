"""
test_evidence_hardening.py
Ticket 67 — Blindaje de Evidencias y Cumplimiento Verificable.
"""
import io
import zipfile
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.metas.infraestructura.models import MetaModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel, RequisitoVerificacionAccionModel
from modulos.uploads.infraestructura.models import UploadModel
from modulos.roles.infraestructura.models import RolModel, UsuarioRolModel
from modulos.miembros.infraestructura.models import ProyectoMiembroModel
from modulos.uploads.dominio.PoliticaArchivoEvidencia import MAX_EVIDENCE_FILE_SIZE_BYTES

STORAGE_PATCH = 'modulos.uploads.infraestructura.UploadController.default_storage'

PDF_HEADER = b'%PDF-1.4 fake content for testing'
JPEG_HEADER = b'\xff\xd8\xff\xe0' + b'\x00' * 100
PNG_HEADER = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100


def _make_xlsx_bytes() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr('[Content_Types].xml', '<Types/>')
        z.writestr('xl/workbook.xml', '<workbook/>')
    return buf.getvalue()


def _make_docx_fake_bytes() -> bytes:
    """ZIP válido pero sin la estructura interna de Word."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr('README.txt', 'This is not a real docx')
    return buf.getvalue()


def _make_docx_bytes() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr('[Content_Types].xml', '<Types/>')
        z.writestr('word/document.xml', '<document/>')
    return buf.getvalue()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(username='t67_super', email='t67@icaro.pe', password='pass')


@pytest.fixture
def proyecto(db, superuser):
    return ProyectoModel.objects.create(name='P T67', created_by=superuser)


@pytest.fixture
def meta(db, proyecto, superuser):
    return MetaModel.objects.create(proyecto=proyecto, nombre='Meta T67', created_by=superuser)


@pytest.fixture
def comp(db, proyecto, meta):
    return ComponenteModel.objects.create(project=proyecto, meta=meta, name='Comp T67')


@pytest.fixture
def accion(db, comp):
    return AccionModel.objects.create(component=comp, name='Acción T67')


@pytest.fixture
def accion_sin_req(db, comp):
    return AccionModel.objects.create(component=comp, name='Acción Sin Requisitos')


@pytest.fixture
def requisito_foto(db, accion):
    return RequisitoVerificacionAccionModel.objects.create(
        accion=accion,
        nombre='Foto evidencia',
        obligatorio=True,
        tipos_archivo_permitidos=['image/jpeg', 'image/png', 'image/webp'],
        min_archivos=1,
        max_archivos=2,
        orden=1,
        activo=True,
    )


@pytest.fixture
def requisito_doc(db, accion):
    return RequisitoVerificacionAccionModel.objects.create(
        accion=accion,
        nombre='Documento soporte',
        obligatorio=True,
        tipos_archivo_permitidos=['application/pdf'],
        min_archivos=1,
        max_archivos=1,
        orden=2,
        activo=True,
    )


@pytest.fixture
def rol_subir(db):
    rol, _ = RolModel.objects.get_or_create(
        codigo='profesional_carga',
        defaults={'nombre': 'Profesional Carga', 'activo': True, 'tipo_alcance': 'proyecto'},
    )
    return rol


@pytest.fixture
def user_subir(db, proyecto, rol_subir):
    u = User.objects.create_user(username='t67_subir', password='pass')
    ProyectoMiembroModel.objects.create(usuario=u, proyecto=proyecto)
    UsuarioRolModel.objects.create(usuario=u, rol=rol_subir, proyecto=proyecto, activo=True)
    return u


@pytest.fixture
def user_otro(db):
    return User.objects.create_user(username='t67_otro', password='pass')


@pytest.fixture
def user_sin_eliminar(db, proyecto, rol_subir):
    u = User.objects.create_user(username='t67_sin_elim', password='pass')
    ProyectoMiembroModel.objects.create(usuario=u, proyecto=proyecto)
    UsuarioRolModel.objects.create(usuario=u, rol=rol_subir, proyecto=proyecto, activo=True)
    return u


def _url_post(accion_id):
    return f'/api/uploads/{accion_id}/uploads/'


def _url_delete(accion_id, upload_id):
    return f'/api/uploads/{accion_id}/uploads/{upload_id}/'


# ── Test 1: acción con requisitos rechaza sin requisito_id ──────────────────

@pytest.mark.django_db
def test_accion_con_requisitos_rechaza_sin_requisito_id(client, superuser, accion, requisito_foto):
    client.force_authenticate(user=superuser)
    archivo = io.BytesIO(JPEG_HEADER)
    archivo.name = 'foto.jpg'
    response = client.post(_url_post(accion.id), {'archivo': archivo}, format='multipart')
    assert response.status_code == 400
    assert 'requisito_id' in response.data.get('error', '')


# ── Test 2: acción sin requisitos permite evidencia libre ────────────────────

@pytest.mark.django_db
def test_accion_sin_requisitos_permite_evidencia_libre(client, superuser, accion_sin_req):
    client.force_authenticate(user=superuser)
    with patch(STORAGE_PATCH) as mock_st:
        mock_st.save.return_value = 'evidencias/test/doc.pdf'
        mock_st.url.return_value = 'http://test/media/doc.pdf'
        archivo = io.BytesIO(PDF_HEADER)
        archivo.name = 'doc.pdf'
        response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
    assert response.status_code == 201, response.data
    assert response.data['ok'] is True


# ── Test 3: requisito de fotos rechaza PDF ───────────────────────────────────

@pytest.mark.django_db
def test_requisito_fotos_rechaza_pdf(client, superuser, accion, requisito_foto):
    client.force_authenticate(user=superuser)
    archivo = io.BytesIO(PDF_HEADER)
    archivo.name = 'documento.pdf'
    response = client.post(
        _url_post(accion.id),
        {'archivo': archivo, 'requisito_id': str(requisito_foto.id)},
        format='multipart',
    )
    assert response.status_code == 400
    errores = response.data.get('errores', [])
    assert any('no acepta' in e or 'image' in e for e in errores)


# ── Test 4: requisito documental rechaza imagen ──────────────────────────────

@pytest.mark.django_db
def test_requisito_documental_rechaza_imagen(client, superuser, accion, requisito_doc):
    client.force_authenticate(user=superuser)
    archivo = io.BytesIO(JPEG_HEADER)
    archivo.name = 'foto.jpg'
    response = client.post(
        _url_post(accion.id),
        {'archivo': archivo, 'requisito_id': str(requisito_doc.id)},
        format='multipart',
    )
    assert response.status_code == 400
    errores = response.data.get('errores', [])
    assert any('no acepta' in e or 'pdf' in e.lower() for e in errores)


# ── Test 5: extensión bloqueada es rechazada ─────────────────────────────────

@pytest.mark.django_db
def test_extension_bloqueada_rechazada(client, superuser, accion_sin_req):
    client.force_authenticate(user=superuser)
    for ext, content in [('.exe', b'MZ\x00\x00'), ('.svg', b'<svg/>'), ('.zip', b'PK\x03\x04')]:
        archivo = io.BytesIO(content + b'\x00' * 20)
        archivo.name = f'archivo{ext}'
        response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
        assert response.status_code == 400, f'Extensión {ext} debería ser rechazada'


# ── Test 6: archivo superior al límite retorna 400 ───────────────────────────

@pytest.mark.django_db
def test_archivo_supera_limite_retorna_400(client, superuser, accion_sin_req):
    """Simula un archivo más grande que MAX_EVIDENCE_FILE_SIZE_MB vía mock del use case de validación."""
    client.force_authenticate(user=superuser)
    UC_PATCH = 'modulos.uploads.infraestructura.UploadController.RegistrarEvidenciaVerificadaUseCase'
    with patch(UC_PATCH) as MockUC:
        mock_instance = MagicMock()
        mock_instance.ejecutar.return_value = [f'El archivo supera el tamaño máximo permitido de 20 MB.']
        MockUC.return_value = mock_instance
        archivo = io.BytesIO(PDF_HEADER)
        archivo.name = 'grande.pdf'
        response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
    assert response.status_code == 400
    errores = response.data.get('errores', [])
    assert any('tamaño' in e.lower() or 'MB' in e for e in errores)


# ── Test 7: DOCX falso (ZIP común) es rechazado ──────────────────────────────

@pytest.mark.django_db
def test_docx_falso_zip_comun_rechazado(client, superuser, accion_sin_req):
    client.force_authenticate(user=superuser)
    fake_docx = _make_docx_fake_bytes()
    archivo = io.BytesIO(fake_docx)
    archivo.name = 'fake.docx'
    response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
    assert response.status_code == 400
    errores = response.data.get('errores', [])
    assert any('docx' in e.lower() or 'word' in e.lower() or 'Word' in e for e in errores)


# ── Test 8: XLSX válido es aceptado ─────────────────────────────────────────

@pytest.mark.django_db
def test_xlsx_valido_aceptado(client, superuser, accion_sin_req):
    client.force_authenticate(user=superuser)
    with patch(STORAGE_PATCH) as mock_st:
        mock_st.save.return_value = 'evidencias/test/datos.xlsx'
        mock_st.url.return_value = 'http://test/media/datos.xlsx'
        archivo = io.BytesIO(_make_xlsx_bytes())
        archivo.name = 'datos.xlsx'
        response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
    assert response.status_code == 201, response.data


# ── Test 9: imagen corrupta con header JPEG es rechazada ─────────────────────

@pytest.mark.django_db
def test_imagen_corrupta_jpeg_rechazada(client, superuser, accion_sin_req):
    client.force_authenticate(user=superuser)
    INSPECTOR = 'modulos.uploads.infraestructura.InspectorArchivoEvidencia._inspeccionar_imagen'
    with patch(INSPECTOR, return_value=['El archivo de imagen está corrupto o no es válido.']):
        archivo = io.BytesIO(JPEG_HEADER)
        archivo.name = 'corrupta.jpg'
        response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
    assert response.status_code == 400
    errores = response.data.get('errores', [])
    assert any('corrupt' in e.lower() or 'imagen' in e.lower() for e in errores)


# ── Test 10: dos cargas no superan max_archivos ──────────────────────────────

@pytest.mark.django_db
def test_cargas_no_superan_max_archivos(client, superuser, accion, requisito_doc):
    client.force_authenticate(user=superuser)
    # Primera carga
    with patch(STORAGE_PATCH) as mock_st:
        mock_st.save.return_value = 'evidencias/test/doc1.pdf'
        mock_st.url.return_value = 'http://test/media/doc1.pdf'
        archivo = io.BytesIO(PDF_HEADER)
        archivo.name = 'doc1.pdf'
        r1 = client.post(
            _url_post(accion.id),
            {'archivo': archivo, 'requisito_id': str(requisito_doc.id)},
            format='multipart',
        )
    assert r1.status_code == 201

    # Segunda carga debe ser rechazada (max_archivos=1)
    archivo2 = io.BytesIO(PDF_HEADER)
    archivo2.name = 'doc2.pdf'
    r2 = client.post(
        _url_post(accion.id),
        {'archivo': archivo2, 'requisito_id': str(requisito_doc.id)},
        format='multipart',
    )
    assert r2.status_code == 400
    errores = r2.data.get('errores', [])
    assert any('máximo' in e.lower() for e in errores)


# ── Test 11: error de BD elimina el archivo físico ───────────────────────────

@pytest.mark.django_db
def test_error_bd_elimina_archivo_fisico(client, superuser, accion_sin_req):
    client.force_authenticate(user=superuser)
    with patch(STORAGE_PATCH) as mock_st:
        mock_st.save.return_value = 'evidencias/test/doc.pdf'
        mock_st.url.return_value = 'http://test/media/doc.pdf'
        with patch('modulos.uploads.infraestructura.UploadController.UploadModel') as MockModel:
            MockModel.objects.filter.return_value.exists.return_value = False
            MockModel.objects.create.side_effect = Exception('DB failure')
            archivo = io.BytesIO(PDF_HEADER)
            archivo.name = 'doc.pdf'
            response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
        mock_st.delete.assert_called_once_with('evidencias/test/doc.pdf')
    assert response.status_code == 400


# ── Test 12: sin evidencias.subir → 403 ─────────────────────────────────────

@pytest.mark.django_db
def test_sin_evidencias_subir_retorna_403(client, user_otro, accion_sin_req):
    """Usuario sin rol en el proyecto recibe 403 o 404."""
    client.force_authenticate(user=user_otro)
    archivo = io.BytesIO(PDF_HEADER)
    archivo.name = 'doc.pdf'
    response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
    assert response.status_code in (403, 404)


# ── Test 13: usuario de otro proyecto recibe 403/404 ────────────────────────

@pytest.mark.django_db
def test_usuario_otro_proyecto_retorna_403(client, user_otro, accion):
    client.force_authenticate(user=user_otro)
    archivo = io.BytesIO(PDF_HEADER)
    archivo.name = 'doc.pdf'
    response = client.post(_url_post(accion.id), {'archivo': archivo}, format='multipart')
    assert response.status_code in (403, 404)


# ── Test 14: sin evidencias.eliminar → 403 ──────────────────────────────────

@pytest.mark.django_db
def test_sin_evidencias_eliminar_retorna_403(client, user_sin_eliminar, accion, accion_sin_req, superuser):
    # Crear un upload como superuser primero
    upload = UploadModel.objects.create(
        action_id=accion_sin_req.id,
        uploaded_by=superuser,
        file_url='http://test/file.pdf',
        file_name='doc.pdf',
        file_type='application/pdf',
        status='pendiente',
    )
    client.force_authenticate(user=user_sin_eliminar)
    response = client.delete(_url_delete(accion_sin_req.id, str(upload.id)))
    assert response.status_code == 403


# ── Test 15: resumen_verificacion calcula correctamente ──────────────────────

@pytest.mark.django_db
def test_resumen_verificacion_calcula_correctamente(client, superuser, accion, requisito_doc):
    client.force_authenticate(user=superuser)

    # Sin uploads: estado pendiente
    url_accion = f'/api/acciones/{accion.component_id}/acciones/{accion.id}/'
    r = client.get(url_accion)
    assert r.status_code == 200
    resumen = r.data['datos']['resumen_verificacion']
    assert resumen['total_requisitos'] == 1
    assert resumen['requisitos_cumplidos'] == 0
    assert resumen['estado'] == 'pendiente'

    # Cargar un archivo para el requisito
    UploadModel.objects.create(
        action_id=accion.id,
        requisito=requisito_doc,
        uploaded_by=superuser,
        file_url='http://test/doc.pdf',
        file_name='doc.pdf',
        file_type='application/pdf',
        status='pendiente',
    )

    r2 = client.get(url_accion)
    assert r2.status_code == 200
    resumen2 = r2.data['datos']['resumen_verificacion']
    assert resumen2['requisitos_cumplidos'] == 1
    assert resumen2['estado'] == 'completo'


# ── Test 16: auditoría registra carga sin exponer rutas locales ───────────────

@pytest.mark.django_db
def test_auditoria_sin_rutas_locales(client, superuser, accion_sin_req):
    from modulos.auditoria.infraestructura.models import AuditLogModel
    client.force_authenticate(user=superuser)
    with patch(STORAGE_PATCH) as mock_st:
        mock_st.save.return_value = 'evidencias/test/doc.pdf'
        mock_st.url.return_value = 'http://test/media/doc.pdf'
        archivo = io.BytesIO(PDF_HEADER)
        archivo.name = 'doc.pdf'
        response = client.post(_url_post(accion_sin_req.id), {'archivo': archivo}, format='multipart')
    assert response.status_code == 201

    # Verificar que existe un log de auditoría
    logs = AuditLogModel.objects.filter(accion='CREAR', modelo_afectado='Upload')
    assert logs.exists()

    # Verificar que ningún campo contiene rutas internas del sistema de archivos
    log = logs.first()
    if log.payload_changes:
        payload_str = str(log.payload_changes)
        assert '/home/' not in payload_str
        assert 'C:\\' not in payload_str
        assert '/var/' not in payload_str
        assert 'evidencias/test/doc.pdf' not in payload_str
