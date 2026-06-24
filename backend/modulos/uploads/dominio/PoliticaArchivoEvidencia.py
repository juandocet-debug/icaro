import os
from typing import List

MAX_EVIDENCE_FILE_SIZE_MB: int = int(os.environ.get('MAX_EVIDENCE_FILE_SIZE_MB', '20'))
MAX_EVIDENCE_FILE_SIZE_BYTES: int = MAX_EVIDENCE_FILE_SIZE_MB * 1024 * 1024

TIPOS_MIME_PERMITIDOS: frozenset = frozenset({
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
})

EXTENSIONES_BLOQUEADAS: frozenset = frozenset({
    '.exe', '.bat', '.cmd', '.ps1', '.sh', '.js', '.html',
    '.svg', '.zip', '.rar', '.py', '.rb', '.php',
})


def validar_nombre(nombre: str) -> List[str]:
    """Rechaza nombre vacío y dobles extensiones sospechosas."""
    if not nombre or not nombre.strip():
        return ['El nombre del archivo es obligatorio.']
    partes = nombre.split('.')
    if len(partes) >= 3:
        for i in range(len(partes) - 1):
            if f'.{partes[i + 1].lower()}' in EXTENSIONES_BLOQUEADAS:
                return [f'Nombre de archivo con extensión sospechosa detectada: {nombre}']
    return []


def validar_tamano(tamano: int) -> List[str]:
    """Rechaza archivos vacíos o que superen el límite configurado."""
    if tamano == 0:
        return ['El archivo está vacío.']
    if tamano > MAX_EVIDENCE_FILE_SIZE_BYTES:
        return [f'El archivo supera el tamaño máximo permitido de {MAX_EVIDENCE_FILE_SIZE_MB} MB.']
    return []
