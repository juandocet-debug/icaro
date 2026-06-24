from abc import ABC, abstractmethod
from typing import Optional, List
from .Entidades import Meta

class MetaRepositoryPort(ABC):
    @abstractmethod
    def crear(self, meta: Meta) -> Meta: pass
    @abstractmethod
    def obtener_por_id(self, id: str) -> Optional[Meta]: pass
    @abstractmethod
    def listar_por_proyecto(self, proyecto_id: str, incluir_archivadas: bool = False) -> List[Meta]: pass
    @abstractmethod
    def actualizar(self, meta: Meta) -> Meta: pass
    @abstractmethod
    def eliminar(self, id: str) -> bool: pass
    @abstractmethod
    def existen_componentes_por_meta(self, meta_id: str) -> bool: pass
