from dataclasses import dataclass
from datetime import datetime, timezone
import uuid

@dataclass
class Notificacion:
    id: uuid.UUID
    usuario_id: int
    mensaje: str
    leido: bool
    created_at: datetime

    @classmethod
    def crear(cls, usuario_id: int, mensaje: str) -> 'Notificacion':
        return cls(
            id=uuid.uuid4(),
            usuario_id=usuario_id,
            mensaje=mensaje,
            leido=False,
            created_at=datetime.now(timezone.utc)
        )
