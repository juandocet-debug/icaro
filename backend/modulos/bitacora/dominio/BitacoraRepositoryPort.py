from abc import ABC, abstractmethod
from typing import List
from .Entidades import Bitacora

class BitacoraRepositoryPort(ABC):
    @abstractmethod
    def registrar(self, bitacora: Bitacora) -> Bitacora:
        pass

    @abstractmethod
    def listar(self) -> List[Bitacora]:
        pass

    @abstractmethod
    def listar_por_usuario(self, usuario_id: int) -> List[Bitacora]:
        pass

