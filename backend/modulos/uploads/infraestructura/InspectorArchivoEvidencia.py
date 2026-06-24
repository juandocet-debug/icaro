import io
import os
import zipfile
from typing import List, Optional


def detectar_mime(archivo) -> Optional[str]:
    """Lee la cabecera del archivo para detectar el MIME real (sin dependencias externas)."""
    header = archivo.read(512)
    archivo.seek(0)
    if header[:4] == b'%PDF':
        return 'application/pdf'
    if header[:3] == b'\xff\xd8\xff':
        return 'image/jpeg'
    if header[:8] == b'\x89PNG\r\n\x1a\n':
        return 'image/png'
    if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        return 'image/webp'
    if header[:8] == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':
        return 'application/msword'
    if header[:2] == b'PK':
        return 'application/zip_based'
    return None


def resolver_mime_zip(nombre_archivo: str) -> Optional[str]:
    """Desambigua ZIP como DOCX o XLSX usando la extensión."""
    ext = os.path.splitext(nombre_archivo)[1].lower()
    if ext == '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if ext == '.xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    return None


def _inspeccionar_pdf(datos: bytes) -> List[str]:
    if not datos.startswith(b'%PDF'):
        return ['El archivo no es un PDF válido.']
    return []


def _inspeccionar_imagen(datos: bytes) -> List[str]:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(datos))
        img.verify()
    except ImportError:
        return []
    except Exception:
        return ['El archivo de imagen está corrupto o no es válido.']
    return []


def _inspeccionar_office_zip(datos: bytes, nombre: str) -> List[str]:
    ext = os.path.splitext(nombre)[1].lower()
    try:
        with zipfile.ZipFile(io.BytesIO(datos)) as z:
            nombres = z.namelist()
            info = z.infolist()
            total_descomp = sum(i.file_size for i in info)
            total_comp = sum(i.compress_size for i in info)

            if total_descomp > 50 * 1024 * 1024:
                return ['El contenido descomprimido del archivo Office supera el límite permitido.']
            if total_comp > 0 and total_descomp / total_comp > 100:
                return ['Ratio de compresión sospechosa detectada (posible ZIP bomb).']

            if ext == '.docx':
                if '[Content_Types].xml' not in nombres:
                    return ['El archivo .docx no tiene estructura válida de documento Word.']
                if 'word/document.xml' not in nombres:
                    return ['El archivo .docx no contiene el cuerpo del documento Word.']
            elif ext == '.xlsx':
                if '[Content_Types].xml' not in nombres:
                    return ['El archivo .xlsx no tiene estructura válida de hoja Excel.']
                if 'xl/workbook.xml' not in nombres:
                    return ['El archivo .xlsx no contiene el libro de trabajo Excel.']
    except zipfile.BadZipFile:
        return [f'El archivo {ext} no es un documento Office válido (ZIP inválido).']
    except Exception:
        return [f'Error al verificar la estructura del archivo {ext}.']
    return []


def _inspeccionar_ole(datos: bytes, nombre: str) -> List[str]:
    OLE_SIG = b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'
    ext = os.path.splitext(nombre)[1].lower()
    if datos[:8] != OLE_SIG:
        return ['El archivo no tiene firma OLE válida.']
    if ext not in ('.doc', '.xls'):
        return [f'Extensión {ext} no coherente con formato Word/Excel legacy.']
    return []


def inspeccionar(archivo, mime_real: str, nombre: str) -> List[str]:
    """Validación estructural profunda según el MIME detectado. Devuelve lista de errores."""
    datos = archivo.read()
    archivo.seek(0)

    if mime_real == 'application/pdf':
        return _inspeccionar_pdf(datos)
    if mime_real in ('image/jpeg', 'image/png', 'image/webp'):
        return _inspeccionar_imagen(datos)
    if mime_real in (
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ):
        return _inspeccionar_office_zip(datos, nombre)
    if mime_real == 'application/msword':
        return _inspeccionar_ole(datos, nombre)
    return []
