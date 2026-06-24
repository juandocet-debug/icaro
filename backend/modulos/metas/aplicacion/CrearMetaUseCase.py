from typing import Optional

from modulos.metas.dominio.Entidades import Meta
from modulos.metas.dominio.MetaRepositoryPort import MetaRepositoryPort


class CrearMetaUseCase:
    def __init__(self, repositorio: MetaRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(
        self,
        proyecto_id: str,
        nombre: str,
        created_by_id: int,
        descripcion: Optional[str] = None,
    ) -> Meta:
        return self.repositorio.crear(
            Meta.crear(
                proyecto_id=proyecto_id,
                nombre=nombre,
                created_by_id=created_by_id,
                descripcion=descripcion,
            )
        )
