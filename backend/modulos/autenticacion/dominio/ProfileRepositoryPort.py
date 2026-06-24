from abc import ABC, abstractmethod
from typing import Optional
from .Entidades import ProfileEntidad

class ProfileRepositoryPort(ABC):
    @abstractmethod
    def obtener_por_user_id(self, user_id: int) -> Optional[ProfileEntidad]:
        pass
    @abstractmethod
    def actualizar(self, profile: ProfileEntidad) -> ProfileEntidad:
        pass
