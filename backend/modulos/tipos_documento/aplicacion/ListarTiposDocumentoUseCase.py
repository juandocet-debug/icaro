from ..dominio.TipoDocumentoRepositoryPort import TipoDocumentoRepositoryPort

class ListarTiposDocumentoUseCase:
    def __init__(self, repo: TipoDocumentoRepositoryPort):
        self.repo = repo

    def ejecutar(self, proyecto_id: str):
        return self.repo.listar_por_proyecto(proyecto_id)
