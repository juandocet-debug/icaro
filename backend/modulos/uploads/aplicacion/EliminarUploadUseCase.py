from modulos.uploads.dominio.UploadRepositoryPort import UploadRepositoryPort
class EliminarUploadUseCase:
    def __init__(self, repositorio: UploadRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str) -> bool:
        return self.repositorio.eliminar(id)
