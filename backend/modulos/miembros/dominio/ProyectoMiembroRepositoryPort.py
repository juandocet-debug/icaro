from abc import ABC, abstractmethod
from typing import List, Optional
from .Entidades import ProyectoMiembro

class ProyectoMiembroRepositoryPort(ABC):
    @abstractmethod
    def listar(self, proyecto_id: str) -> List[ProyectoMiembro]: ...
    @abstractmethod
    def obtener(self, miembro_id: str, proyecto_id: str) -> Optional[ProyectoMiembro]: ...
    @abstractmethod
    def existe(self, proyecto_id: str, usuario_id: int) -> bool: ...
