from modulos.metas.dominio.MetaRepositoryPort import MetaRepositoryPort
from modulos.metas.dominio.Entidades import Meta

class ArchivarMetaUseCase:
    def __init__(self, repositorio: MetaRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, meta_id: str, updated_by_id: int) -> Meta:
        meta = self.repositorio.obtener_por_id(meta_id)
        if not meta:
            raise ValueError("Meta no encontrada.")
        
        # Check if there are active components under this meta using port method.
        if self.repositorio.existen_componentes_por_meta(meta_id):
            raise ValueError("No se puede archivar una meta con componentes activos.")
            
        meta.activo = False
        meta.updated_by_id = updated_by_id
        return self.repositorio.actualizar(meta)
