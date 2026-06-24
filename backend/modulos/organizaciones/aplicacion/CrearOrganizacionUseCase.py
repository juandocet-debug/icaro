from modulos.organizaciones.dominio.OrganizacionRepositoryPort import OrganizacionRepositoryPort
from modulos.organizaciones.dominio.Entidades import Organizacion
from typing import Optional


class CrearOrganizacionUseCase:
    """Caso de uso: registrar una nueva organización en el sistema."""

    def __init__(self, repositorio: OrganizacionRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, nombre: str, sigla: Optional[str] = None, nit: Optional[str] = None) -> Organizacion:
        """
        Crea y persiste una nueva organización.
        Lanza ValueError si el nombre está vacío.
        """
        if not nombre or not nombre.strip():
            raise ValueError("El nombre de la organización es obligatorio.")
        org = Organizacion.registrar(nombre=nombre.strip(), sigla=sigla, nit=nit)
        return self.repositorio.crear(org)
