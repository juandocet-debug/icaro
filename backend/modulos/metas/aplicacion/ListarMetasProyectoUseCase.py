from modulos.metas.dominio.MetaRepositoryPort import MetaRepositoryPort
from modulos.metas.dominio.Entidades import Meta
from typing import List

class ListarMetasProyectoUseCase:
    def __init__(self, repositorio: MetaRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, proyecto_id: str, incluir_archivadas: bool = False) -> List[Meta]:
        return self.repositorio.listar_por_proyecto(proyecto_id, incluir_archivadas)
