from abc import ABC, abstractmethod
from typing import Optional, List
from .Entidades import Organizacion


class OrganizacionRepositoryPort(ABC):
    """
    Puerto (contrato de dominio) para el repositorio de Organizaciones.
    La infraestructura debe implementar esta interfaz. El dominio y la
    capa de aplicación nunca importan la implementación concreta.
    """

    @abstractmethod
    def crear(self, organizacion: Organizacion) -> Organizacion:
        """Persiste una nueva organización y la retorna con su id generado."""
        pass

    @abstractmethod
    def obtener_por_id(self, id: str) -> Optional[Organizacion]:
        """Retorna la organización con el id dado, o None si no existe."""
        pass

    @abstractmethod
    def listar(self, solo_activas: bool = True) -> List[Organizacion]:
        """Retorna el listado de organizaciones, filtrado por estado si se indica."""
        pass

    @abstractmethod
    def actualizar(self, organizacion: Organizacion) -> Organizacion:
        """Actualiza los datos de una organización existente."""
        pass

    @abstractmethod
    def eliminar(self, id: str) -> bool:
        """Elimina lógicamente la organización. Retorna True si fue exitoso."""
        pass
