from abc import ABC, abstractmethod
from .Entidades import AuditLogEntidad

class AuditLogRepositoryPort(ABC):
    @abstractmethod
    def registrar(self, log: AuditLogEntidad) -> AuditLogEntidad:
        """Persiste un nuevo registro de auditoría."""
        pass
