from dataclasses import dataclass
from typing import Optional
import uuid


@dataclass
class Meta:
    id: str
    proyecto_id: str
    nombre: str
    descripcion: Optional[str]
    activo: bool
    created_by_id: int
    updated_by_id: Optional[int] = None

    @classmethod
    def crear(
        cls,
        proyecto_id: str,
        nombre: str,
        created_by_id: int,
        descripcion: Optional[str] = None,
    ) -> 'Meta':
        if not nombre or not nombre.strip():
            raise ValueError('El nombre de la meta es obligatorio.')
        return cls(
            id=str(uuid.uuid4()),
            proyecto_id=proyecto_id,
            nombre=nombre.strip(),
            descripcion=descripcion.strip() if descripcion else None,
            activo=True,
            created_by_id=created_by_id,
        )
