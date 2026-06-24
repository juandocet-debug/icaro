from modulos.uploads.dominio.UploadRepositoryPort import UploadRepositoryPort
from modulos.uploads.dominio.Entidades import Upload
class RegistrarUploadUseCase:
    def __init__(self, repositorio: UploadRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, accion_id: str, uploaded_by_id: int, file_url: str, file_name: str, **kwargs) -> Upload:
        return self.repositorio.registrar(Upload.registrar(accion_id=accion_id, uploaded_by_id=uploaded_by_id, file_url=file_url, file_name=file_name, **kwargs))
