from modulos.acciones.dominio.AccionRepositoryPort import AccionRepositoryPort
from modulos.acciones.dominio.Entidades import Accion
class CrearAccionUseCase:
    def __init__(self, repositorio: AccionRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, componente_id: str, name: str, **kwargs) -> Accion:
        return self.repositorio.crear(Accion.crear(componente_id=componente_id, name=name, **kwargs))
