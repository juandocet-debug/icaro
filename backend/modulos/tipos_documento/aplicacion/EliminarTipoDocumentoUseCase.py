from ..dominio.TipoDocumentoRepositoryPort import TipoDocumentoRepositoryPort

class EliminarTipoDocumentoUseCase:
    def __init__(self, repo: TipoDocumentoRepositoryPort):
        self.repo = repo

    def ejecutar(self, tipo_id: str, proyecto_id: str) -> bool:
        return self.repo.eliminar(tipo_id, proyecto_id)
