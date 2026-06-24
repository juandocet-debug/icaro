from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class AsignacionResponsable:
    id: Optional[str]
    accion_id: str
    usuario_id: int
    tipo_asignacion: str  # 'responsable' | 'apoyo'
    activo: bool
    assigned_by_id: Optional[int]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
