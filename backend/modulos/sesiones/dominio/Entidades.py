from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
import uuid

@dataclass
class Sesion:
    id: uuid.UUID
    usuario_id: int
    token_jti: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    @classmethod
    def crear(cls, usuario_id: int, token_jti: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> 'Sesion':
        return cls(
            id=uuid.uuid4(),
            usuario_id=usuario_id,
            token_jti=token_jti,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc)
        )
