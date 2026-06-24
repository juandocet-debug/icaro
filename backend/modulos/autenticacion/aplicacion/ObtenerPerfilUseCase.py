from modulos.autenticacion.dominio.ProfileRepositoryPort import ProfileRepositoryPort
from modulos.autenticacion.dominio.Entidades import ProfileEntidad
from typing import Optional

class ObtenerPerfilUseCase:
    def __init__(self, repositorio: ProfileRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, user_id: int) -> Optional[ProfileEntidad]:
        return self.repositorio.obtener_por_user_id(user_id)
