from dataclasses import dataclass
from typing import Optional
import uuid

@dataclass
class ProfileEntidad:
    id: str
    user_id: int
    telefono: Optional[str]
    cargo: Optional[str]
    organizacion_id: Optional[str]

    @classmethod
    def crear(cls, user_id: int, telefono: Optional[str] = None,
              cargo: Optional[str] = None, organizacion_id: Optional[str] = None) -> 'ProfileEntidad':
        return cls(id=str(uuid.uuid4()), user_id=user_id,
                   telefono=telefono, cargo=cargo, organizacion_id=organizacion_id)
