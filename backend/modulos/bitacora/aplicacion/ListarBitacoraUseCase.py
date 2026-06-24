from modulos.bitacora.dominio.BitacoraRepositoryPort import BitacoraRepositoryPort
from modulos.bitacora.dominio.Entidades import Bitacora
from typing import List

class ListarBitacoraUseCase:
    def __init__(self, repositorio: BitacoraRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, usuario_id: int, es_admin: bool = False) -> List[Bitacora]:
        if es_admin:
            return self.repositorio.listar()
        return self.repositorio.listar_por_usuario(usuario_id)

