from modulos.sesiones.dominio.SesionRepositoryPort import SesionRepositoryPort
from modulos.sesiones.dominio.Entidades import Sesion
from typing import List

class ListarSesionesUseCase:
    def __init__(self, repositorio: SesionRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, usuario_id: int) -> List[Sesion]:
        return self.repositorio.listar_por_usuario(usuario_id)
