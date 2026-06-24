from ..dominio.TipoDocumentoRepositoryPort import TipoDocumentoRepositoryPort
from ..dominio.Entidades import TipoDocumentoEntidad

class ActualizarTipoDocumentoUseCase:
    def __init__(self, repo: TipoDocumentoRepositoryPort):
        self.repo = repo

    def ejecutar(self, tipo_id: str, proyecto_id: str,
                 nombre: str, descripcion: str = None) -> TipoDocumentoEntidad:
        if not nombre or not nombre.strip():
            raise ValueError('El nombre del tipo de documento es obligatorio.')
        return self.repo.actualizar(tipo_id, proyecto_id,
                                    nombre.strip(), descripcion)
