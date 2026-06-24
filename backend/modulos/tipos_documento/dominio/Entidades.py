from dataclasses import dataclass
from typing import Optional
import uuid

@dataclass
class TipoDocumentoEntidad:
    id: str
    proyecto_id: str
    nombre: str
    descripcion: Optional[str]
    orden: int
    creado_por_id: int

    @classmethod
    def crear(cls, proyecto_id: str, nombre: str,
              creado_por_id: int, descripcion: str = None,
              orden: int = 0) -> 'TipoDocumentoEntidad':
        if not nombre or not nombre.strip():
            raise ValueError('El nombre del tipo de documento es obligatorio.')
        return cls(
            id=str(uuid.uuid4()),
            proyecto_id=proyecto_id,
            nombre=nombre.strip(),
            descripcion=descripcion,
            orden=orden,
            creado_por_id=creado_por_id,
        )
