from abc import ABC, abstractmethod
from typing import Optional, List
from .Entidades import Componente

class ComponenteRepositoryPort(ABC):
    @abstractmethod
    def crear(self, componente: Componente) -> Componente: pass
    @abstractmethod
    def obtener_por_id(self, id: str) -> Optional[Componente]: pass
    @abstractmethod
    def listar_por_proyecto(self, proyecto_id: str) -> List[Componente]: pass
    @abstractmethod
    def actualizar(self, componente: Componente) -> Componente: pass
    @abstractmethod
    def eliminar(self, id: str) -> bool: pass
