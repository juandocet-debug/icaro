from abc import ABC, abstractmethod
from typing import List
from .Entidades import Sesion

class SesionRepositoryPort(ABC):
    @abstractmethod
    def registrar(self, sesion: Sesion) -> Sesion:
        pass

    @abstractmethod
    def listar_por_usuario(self, usuario_id: int) -> List[Sesion]:
        pass
