from dataclasses import dataclass
from datetime import datetime, timezone
import uuid

@dataclass
class Evidencia:
    id: uuid.UUID
    nombre: str
    url: str
    proyecto_id: uuid.UUID
    created_at: datetime

    @classmethod
    def crear(cls, nombre: str, url: str, proyecto_id: uuid.UUID) -> 'Evidencia':
        return cls(
            id=uuid.uuid4(),
            nombre=nombre,
            url=url,
            proyecto_id=proyecto_id,
            created_at=datetime.now(timezone.utc)
        )
