from typing import List
from ..dominio.RolRepositoryPort import RolRepositoryPort
from ..dominio.Entidades import Rol

class ListarRolesUseCase:
    def __init__(self, repo: RolRepositoryPort):
        self.repo = repo

    def ejecutar(self) -> List[Rol]:
        return self.repo.listar_roles()
