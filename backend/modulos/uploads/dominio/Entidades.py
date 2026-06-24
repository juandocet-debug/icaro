from dataclasses import dataclass
from typing import Optional
import uuid

@dataclass
class Upload:
    """
    ATENCIÓN (Relación temporal): accion_id apunta a Accion directamente.
    En versiones posteriores apuntará a Sesion operativa.
    """
    id: str
    accion_id: str
    uploaded_by_id: int
    file_url: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    status: str = 'pendiente'
    verified_by_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    receipt_number: Optional[str] = None

    @classmethod
    def registrar(cls, accion_id: str, uploaded_by_id: int,
                  file_url: str, file_name: str, **kwargs) -> 'Upload':
        if not file_url or not file_name:
            raise ValueError('La URL y el nombre del archivo son obligatorios.')
        return cls(id=str(uuid.uuid4()), accion_id=accion_id,
                   uploaded_by_id=uploaded_by_id, file_url=file_url,
                   file_name=file_name, **kwargs)

    def aprobar(self, verified_by_id: int):
        self.status = 'aprobado'
        self.verified_by_id = verified_by_id

    def rechazar(self, verified_by_id: int, razon: str):
        self.status = 'rechazado'
        self.verified_by_id = verified_by_id
        self.rejection_reason = razon
