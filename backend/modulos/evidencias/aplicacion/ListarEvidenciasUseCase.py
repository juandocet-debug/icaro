from modulos.evidencias.dominio.EvidenciaRepositoryPort import EvidenciaRepositoryPort
from modulos.evidencias.dominio.Entidades import Evidencia
from typing import List
import uuid

class ListarEvidenciasUseCase:
    def __init__(self, repositorio: EvidenciaRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, proyecto_id: str) -> List[Evidencia]:
        proj_uuid = uuid.UUID(proyecto_id)
        return self.repositorio.listar_por_proyecto(proj_uuid)
