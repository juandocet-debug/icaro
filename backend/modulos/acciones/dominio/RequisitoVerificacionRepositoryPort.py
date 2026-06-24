from abc import ABC, abstractmethod
from typing import List
from .RequisitoVerificacion import RequisitoVerificacion


class RequisitoVerificacionRepositoryPort(ABC):
    @abstractmethod
    def crear(self, requisito: RequisitoVerificacion) -> RequisitoVerificacion: ...

    @abstractmethod
    def listar_por_accion(self, accion_id: str) -> List[RequisitoVerificacion]: ...

    @abstractmethod
    def reemplazar_todos(self, accion_id: str, requisitos: List[RequisitoVerificacion]) -> List[RequisitoVerificacion]: ...
