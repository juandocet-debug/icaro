from modulos.uploads.dominio.UploadRepositoryPort import UploadRepositoryPort
class ListarUploadsUseCase:
    def __init__(self, repositorio: UploadRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, accion_id: str):
        return self.repositorio.listar_por_accion(accion_id)
