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
    primer_nombre: Optional[str] = ""
    segundo_nombre: Optional[str] = None
    primer_apellido: Optional[str] = ""
    segundo_apellido: Optional[str] = None

    @classmethod
    def crear(cls, user_id: int, telefono: Optional[str] = None,
              cargo: Optional[str] = None, organizacion_id: Optional[str] = None,
              primer_nombre: Optional[str] = "", segundo_nombre: Optional[str] = None,
              primer_apellido: Optional[str] = "", segundo_apellido: Optional[str] = None) -> 'ProfileEntidad':
        return cls(id=str(uuid.uuid4()), user_id=user_id,
                   telefono=telefono, cargo=cargo, organizacion_id=organizacion_id,
                   primer_nombre=primer_nombre, segundo_nombre=segundo_nombre,
                   primer_apellido=primer_apellido, segundo_apellido=segundo_apellido)
