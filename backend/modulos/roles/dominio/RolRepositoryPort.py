from abc import ABC, abstractmethod
from typing import List, Optional
from .Entidades import Rol, Permiso, UsuarioRol

class RolRepositoryPort(ABC):
    @abstractmethod
    def obtener_rol_por_id(self, rol_id: str) -> Optional[Rol]:
        pass

    @abstractmethod
    def obtener_rol_por_nombre(self, nombre: str) -> Optional[Rol]:
        pass

    @abstractmethod
    def obtener_rol_por_codigo(self, codigo: str) -> Optional[Rol]:
        pass

    @abstractmethod
    def listar_roles(self) -> List[Rol]:
        pass

    @abstractmethod
    def crear_rol(self, rol: Rol, permisos: List[str]) -> Rol:
        pass

    @abstractmethod
    def actualizar_rol(self, rol: Rol, permisos: List[str]) -> Rol:
        pass

    @abstractmethod
    def eliminar_rol(self, rol_id: str) -> bool:
        pass

    @abstractmethod
    def listar_permisos(self) -> List[Permiso]:
        pass

    @abstractmethod
    def asignar_rol_usuario(self, usuario_id: int, rol_id: str, proyecto_id: Optional[str] = None, componente_id: Optional[str] = None, accion_id: Optional[str] = None) -> UsuarioRol:
        pass

    @abstractmethod
    def remover_rol_usuario(self, usuario_id: int, rol_id: str, proyecto_id: Optional[str] = None) -> bool:
        pass

    @abstractmethod
    def obtener_roles_usuario(self, usuario_id: int) -> List[UsuarioRol]:
        pass
