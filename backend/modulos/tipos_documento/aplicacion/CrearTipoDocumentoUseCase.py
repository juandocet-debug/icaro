from ..dominio.TipoDocumentoRepositoryPort import TipoDocumentoRepositoryPort
from ..dominio.Entidades import TipoDocumentoEntidad

class CrearTipoDocumentoUseCase:
    def __init__(self, repo: TipoDocumentoRepositoryPort):
        self.repo = repo

    def ejecutar(self, proyecto_id: str, nombre: str,
                 creado_por_id: int, descripcion: str = None,
                 orden: int = 0) -> TipoDocumentoEntidad:
        entidad = TipoDocumentoEntidad.crear(
            proyecto_id=proyecto_id, nombre=nombre,
            creado_por_id=creado_por_id, descripcion=descripcion, orden=orden)
        return self.repo.crear(entidad)
