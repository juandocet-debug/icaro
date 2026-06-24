from dataclasses import dataclass
from typing import Optional
from datetime import date
import uuid
import secrets

@dataclass
class Proyecto:
    id: str
    name: str
    created_by_id: Optional[int]
    contract_number: Optional[str] = None
    contract_object: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = 'activo'
    public_access_token: Optional[str] = None

    @classmethod
    def crear(cls, name: str, created_by_id: int, **kwargs) -> 'Proyecto':
        if not name or not name.strip():
            raise ValueError('El nombre del proyecto es obligatorio.')
        from .ValueObjects import EstadoProyecto
        EstadoProyecto(kwargs.get('status', 'activo'))
        return cls(id=str(uuid.uuid4()), name=name.strip(),
                   created_by_id=created_by_id,
                   public_access_token=secrets.token_urlsafe(16), **kwargs)

    def cambiar_estado(self, nuevo_estado: str):
        from .ValueObjects import EstadoProyecto
        EstadoProyecto(nuevo_estado)
        self.status = nuevo_estado
