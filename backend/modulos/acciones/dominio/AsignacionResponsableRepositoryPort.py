from abc import ABC, abstractmethod
from typing import List, Optional
from .AsignacionResponsable import AsignacionResponsable

class AsignacionResponsableRepositoryPort(ABC):
    @abstractmethod
    def guardar(self, asignacion: AsignacionResponsable) -> AsignacionResponsable:
        pass

    @abstractmethod
    def obtener_por_id(self, asignacion_id: str) -> Optional[AsignacionResponsable]:
        pass

    @abstractmethod
    def buscar_activas_por_accion(self, accion_id: str) -> List[AsignacionResponsable]:
        pass

    @abstractmethod
    def buscar_activas_por_usuario(self, usuario_id: int) -> List[AsignacionResponsable]:
        pass

    @abstractmethod
    def desactivar_por_usuario(self, usuario_id: int) -> None:
        pass

    @abstractmethod
    def desactivar_por_proyecto_usuario(self, proyecto_id: str, usuario_id: int) -> None:
        pass

    @abstractmethod
    def buscar_miembros_asignables(self, accion_id: str, q: str = "") -> list:
        """Devuelve usuarios activos del proyecto con rol activo, filtrados por q."""
        pass

    @abstractmethod
    def validar_asignacion_posible(self, accion_id: str, usuario_id: int) -> None:
        """Verifica membresía, rol activo y ausencia de duplicado. Lanza ValueError si falla."""
        pass

    @abstractmethod
    def listar_acciones_para_usuario(self, usuario_id: int, es_superuser: bool,
                                     q: str = "", estado: str = "", proyecto_id: str = ""):
        """Devuelve QuerySet de acciones visibles para el usuario según su rol y asignaciones."""
        pass
