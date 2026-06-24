from abc import ABC, abstractmethod
from typing import Optional, List
from .Entidades import Proyecto

class ProyectoRepositoryPort(ABC):
    @abstractmethod
    def crear(self, proyecto: Proyecto) -> Proyecto: pass
    @abstractmethod
    def obtener_por_id(self, id: str) -> Optional[Proyecto]: pass
    @abstractmethod
    def obtener_por_id_para_usuario(self, id: str, user_id: str) -> Optional[Proyecto]: pass
    @abstractmethod
    def contar(self) -> int: pass
    @abstractmethod
    def contar_por_usuario(self, user_id: str) -> int: pass
    @abstractmethod
    def listar(self, limit: int = 20, offset: int = 0) -> List[Proyecto]: pass
    @abstractmethod
    def listar_por_usuario(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Proyecto]: pass
    @abstractmethod
    def actualizar(self, proyecto: Proyecto) -> Proyecto: pass
    @abstractmethod
    def eliminar(self, id: str) -> bool: pass
