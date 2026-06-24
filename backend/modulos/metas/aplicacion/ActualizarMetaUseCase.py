from typing import Optional

from modulos.metas.dominio.Entidades import Meta
from modulos.metas.dominio.MetaRepositoryPort import MetaRepositoryPort


class ActualizarMetaUseCase:
    def __init__(self, repositorio: MetaRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(
        self,
        meta_id: str,
        updated_by_id: int,
        nombre: Optional[str] = None,
        descripcion: Optional[str] = None,
    ) -> Meta:
        meta = self.repositorio.obtener_por_id(meta_id)
        if not meta:
            raise ValueError('Meta no encontrada.')
        if nombre is not None:
            if not nombre.strip():
                raise ValueError('El nombre de la meta es obligatorio.')
            meta.nombre = nombre.strip()
        if descripcion is not None:
            meta.descripcion = descripcion.strip() or None
        meta.updated_by_id = updated_by_id
        return self.repositorio.actualizar(meta)
