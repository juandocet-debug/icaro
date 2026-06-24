from dataclasses import dataclass, field
from typing import Optional, List
import uuid
from modulos.uploads.dominio.PoliticaArchivoEvidencia import (
    TIPOS_MIME_PERMITIDOS, EXTENSIONES_BLOQUEADAS,
)


@dataclass
class RequisitoVerificacion:
    id: str
    accion_id: str
    nombre: str
    descripcion: Optional[str]
    obligatorio: bool
    tipos_archivo_permitidos: List[str]
    min_archivos: int
    max_archivos: Optional[int]
    orden: int
    activo: bool = True

    @classmethod
    def crear(
        cls,
        accion_id: str,
        nombre: str,
        tipos_archivo_permitidos: List[str],
        min_archivos: int = 1,
        max_archivos: Optional[int] = None,
        obligatorio: bool = True,
        descripcion: Optional[str] = None,
        orden: int = 0,
    ) -> 'RequisitoVerificacion':
        if not nombre or not nombre.strip():
            raise ValueError('El nombre del requisito es obligatorio.')
        if not tipos_archivo_permitidos:
            raise ValueError('El requisito debe tener al menos un tipo de archivo permitido.')
        invalidos = set(tipos_archivo_permitidos) - TIPOS_MIME_PERMITIDOS
        if invalidos:
            raise ValueError(f'Tipos MIME no permitidos: {", ".join(sorted(invalidos))}')
        if min_archivos < 0:
            raise ValueError('min_archivos no puede ser negativo.')
        if obligatorio and min_archivos < 1:
            raise ValueError('Un requisito obligatorio debe tener min_archivos >= 1.')
        if max_archivos is not None and max_archivos < min_archivos:
            raise ValueError('max_archivos debe ser >= min_archivos.')
        return cls(
            id=str(uuid.uuid4()),
            accion_id=accion_id,
            nombre=nombre.strip(),
            descripcion=descripcion.strip() if descripcion else None,
            obligatorio=obligatorio,
            tipos_archivo_permitidos=list(tipos_archivo_permitidos),
            min_archivos=min_archivos,
            max_archivos=max_archivos,
            orden=orden,
            activo=True,
        )
