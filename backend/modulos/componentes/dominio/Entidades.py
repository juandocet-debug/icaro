from dataclasses import dataclass
from typing import Optional
import uuid

@dataclass
class Componente:
    id: str
    proyecto_id: str
    meta_id: str
    name: str
    description: Optional[str] = None
    display_order: int = 0

    @classmethod
    def crear(cls, proyecto_id: str, meta_id: str, name: str, **kwargs) -> 'Componente':
        if not name or not name.strip():
            raise ValueError('El nombre del componente es obligatorio.')
        if not meta_id:
            raise ValueError('La meta es obligatoria.')
        return cls(id=str(uuid.uuid4()), proyecto_id=proyecto_id, meta_id=meta_id, name=name.strip(), **kwargs)
