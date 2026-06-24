from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
import uuid

@dataclass
class Bitacora:
    id: uuid.UUID
    usuario_id: Optional[int]
    descripcion: str
    created_at: datetime

    @classmethod
    def crear(cls, descripcion: str, usuario_id: Optional[int] = None) -> 'Bitacora':
        return cls(
            id=uuid.uuid4(),
            usuario_id=usuario_id,
            descripcion=descripcion,
            created_at=datetime.now(timezone.utc)
        )
