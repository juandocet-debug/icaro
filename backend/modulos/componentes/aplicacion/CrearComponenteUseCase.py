from modulos.componentes.dominio.ComponenteRepositoryPort import ComponenteRepositoryPort
from modulos.componentes.dominio.Entidades import Componente
class CrearComponenteUseCase:
    def __init__(self, repositorio: ComponenteRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, proyecto_id: str, meta_id: str, name: str, **kwargs) -> Componente:
        return self.repositorio.crear(Componente.crear(proyecto_id=proyecto_id, meta_id=meta_id, name=name, **kwargs))
