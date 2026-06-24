from abc import ABC, abstractmethod
from typing import List
import uuid
from .Entidades import Evidencia

class EvidenciaRepositoryPort(ABC):
    @abstractmethod
    def registrar(self, evidencia: Evidencia) -> Evidencia:
        pass

    @abstractmethod
    def listar_por_proyecto(self, proyecto_id: uuid.UUID) -> List[Evidencia]:
        pass
