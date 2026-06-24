from abc import ABC, abstractmethod
from typing import Optional, List
from .Entidades import Upload

class UploadRepositoryPort(ABC):
    @abstractmethod
    def registrar(self, upload: Upload) -> Upload: pass
    @abstractmethod
    def obtener_por_id(self, id: str) -> Optional[Upload]: pass
    @abstractmethod
    def listar_por_accion(self, accion_id: str) -> List[Upload]: pass
    @abstractmethod
    def eliminar(self, id: str) -> bool: pass
