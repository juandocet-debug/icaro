from abc import ABC, abstractmethod

class UsuarioRepositoryPort(ABC):
    @abstractmethod
    def obtener_por_id(self, user_id: int):
        pass

    @abstractmethod
    def actualizar(self, user_id: int, datos: dict):
        pass

    @abstractmethod
    def eliminar(self, user_id: int, superadmin_id: int):
        pass
