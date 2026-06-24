from modulos.evidencias.dominio.EvidenciaRepositoryPort import EvidenciaRepositoryPort
from modulos.evidencias.dominio.Entidades import Evidencia
import uuid

class RegistrarEvidenciaUseCase:
    def __init__(self, repositorio: EvidenciaRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, nombre: str, url: str, proyecto_id: str) -> Evidencia:
        if not nombre.strip():
            raise ValueError("El nombre no puede estar vacío.")
        if not url.strip():
            raise ValueError("La URL no puede estar vacía.")
        proj_uuid = uuid.UUID(proyecto_id)
        evidencia = Evidencia.crear(nombre=nombre, url=url, proyecto_id=proj_uuid)
        return self.repositorio.registrar(evidencia)
