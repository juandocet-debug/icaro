from modulos.organizaciones.dominio.OrganizacionRepositoryPort import OrganizacionRepositoryPort
from modulos.organizaciones.dominio.Entidades import Organizacion
from typing import List


class ListarOrganizacionesUseCase:
    """Caso de uso: listar organizaciones activas del sistema."""

    def __init__(self, repositorio: OrganizacionRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, solo_activas: bool = True) -> List[Organizacion]:
        """Retorna el listado de organizaciones según el filtro de estado."""
        return self.repositorio.listar(solo_activas=solo_activas)
