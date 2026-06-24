from abc import ABC, abstractmethod
from typing import List
from .Entidades import Notificacion

class NotificacionRepositoryPort(ABC):
    @abstractmethod
    def registrar(self, notificacion: Notificacion) -> Notificacion:
        pass

    @abstractmethod
    def listar_por_usuario(self, usuario_id: int) -> List[Notificacion]:
        pass

    @abstractmethod
    def marcar_como_leida(self, notificacion_id: str) -> bool:
        pass

    @abstractmethod
    def obtener_por_id(self, notificacion_id: str) -> Notificacion:
        pass

    @abstractmethod
    def marcar_como_leida_para_usuario(self, notificacion_id: str, user_id: int, es_admin: bool = False) -> bool:
        pass

