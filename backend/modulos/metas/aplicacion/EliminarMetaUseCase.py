from modulos.metas.dominio.MetaRepositoryPort import MetaRepositoryPort


class EliminarMetaUseCase:
    def __init__(self, repositorio: MetaRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, meta_id: str) -> bool:
        meta = self.repositorio.obtener_por_id(meta_id)
        if not meta:
            raise ValueError('Meta no encontrada.')
        return self.repositorio.eliminar(meta_id)
