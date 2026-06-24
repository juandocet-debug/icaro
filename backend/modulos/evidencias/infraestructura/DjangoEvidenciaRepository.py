from modulos.evidencias.dominio.EvidenciaRepositoryPort import EvidenciaRepositoryPort
from modulos.evidencias.dominio.Entidades import Evidencia
from .models import EvidenciaModel
from typing import List
import uuid

class DjangoEvidenciaRepository(EvidenciaRepositoryPort):
    def registrar(self, e: Evidencia) -> Evidencia:
        obj = EvidenciaModel.objects.create(
            id=e.id,
            nombre=e.nombre,
            url=e.url,
            proyecto_id=e.proyecto_id
        )
        e.created_at = obj.created_at
        return e

    def listar_por_proyecto(self, proyecto_id: uuid.UUID) -> List[Evidencia]:
        objs = EvidenciaModel.objects.filter(proyecto_id=proyecto_id)
        return [
            Evidencia(id=o.id, nombre=o.nombre, url=o.url, proyecto_id=o.proyecto_id, created_at=o.created_at)
            for o in objs
        ]
