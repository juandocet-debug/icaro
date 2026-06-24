from dataclasses import dataclass
from typing import Optional
import uuid

@dataclass
class ProyectoMiembro:
    id: str
    proyecto_id: str
    usuario_id: int
    username: str
    email: str
    nombre_completo: str
    cargo: Optional[str]
    agregado_por_id: int

    @classmethod
    def crear(cls, proyecto_id: str, usuario_id: int, username: str,
              email: str, nombre_completo: str, cargo: Optional[str],
              agregado_por_id: int) -> 'ProyectoMiembro':
        return cls(
            id=str(uuid.uuid4()),
            proyecto_id=proyecto_id,
            usuario_id=usuario_id,
            username=username,
            email=email,
            nombre_completo=nombre_completo,
            cargo=cargo,
            agregado_por_id=agregado_por_id,
        )
