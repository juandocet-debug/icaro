from dataclasses import dataclass, field
from typing import Optional
import uuid

@dataclass
class AuditLogEntidad:
    id: str
    usuario_id: Optional[int]
    accion: str
    metodo_http: str
    ruta: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    modelo_afectado: Optional[str] = None
    objeto_id: Optional[str] = None
    payload_changes: Optional[dict] = None

    @classmethod
    def registrar(cls, accion: str, metodo_http: str, ruta: str, **kwargs) -> 'AuditLogEntidad':
        return cls(id=str(uuid.uuid4()), accion=accion,
                   metodo_http=metodo_http, ruta=ruta, **kwargs)
