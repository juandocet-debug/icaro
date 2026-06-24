from abc import ABC, abstractmethod
from typing import List
from .Entidades import TipoDocumentoEntidad

class TipoDocumentoRepositoryPort(ABC):
    @abstractmethod
    def crear(self, entidad: TipoDocumentoEntidad) -> TipoDocumentoEntidad: ...
    @abstractmethod
    def listar_por_proyecto(self, proyecto_id: str) -> List[TipoDocumentoEntidad]: ...
    @abstractmethod
    def eliminar(self, tipo_id: str, proyecto_id: str) -> bool: ...
    @abstractmethod
    def actualizar(self, tipo_id: str, proyecto_id: str,
                   nombre: str, descripcion: str = None) -> TipoDocumentoEntidad: ...
