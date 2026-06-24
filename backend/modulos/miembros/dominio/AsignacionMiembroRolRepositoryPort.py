from abc import ABC, abstractmethod


class AsignacionMiembroRolRepositoryPort(ABC):
    @abstractmethod
    def existe_miembro(self, proyecto_id: str, usuario_id: int) -> bool:
        pass

    @abstractmethod
    def agregar_rol_a_miembro(
        self,
        proyecto_id: str,
        usuario_id: int,
        rol_id: str,
        componente_id: str = None,
        accion_id: str = None,
        agregado_por_id: int = None,
    ):
        pass

    @abstractmethod
    def actualizar_asignacion_rol(
        self,
        proyecto_id: str,
        asignacion_id: str,
        rol_id: str,
        componente_id: str = None,
        accion_id: str = None,
    ):
        pass

    @abstractmethod
    def retirar_rol_de_miembro(self, proyecto_id: str, asignacion_id: str):
        pass

    @abstractmethod
    def retirar_miembro_del_proyecto(self, proyecto_id: str, miembro_id: str):
        pass
