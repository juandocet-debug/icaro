from abc import ABC, abstractmethod
from typing import Optional, List
from .Entidades import Accion

class AccionRepositoryPort(ABC):
    @abstractmethod
    def crear(self, accion: Accion) -> Accion: pass
    @abstractmethod
    def obtener_por_id(self, id: str) -> Optional[Accion]: pass
    @abstractmethod
    def listar_por_componente(self, componente_id: str) -> List[Accion]: pass
    @abstractmethod
    def actualizar(self, accion: Accion) -> Accion: pass
    @abstractmethod
    def eliminar(self, id: str) -> bool: pass
