from modulos.proyectos.dominio.ProyectoRepositoryPort import ProyectoRepositoryPort
from modulos.proyectos.dominio.Entidades import Proyecto

class CrearProyectoUseCase:
    def __init__(self, repositorio: ProyectoRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, name: str, created_by_id: int, **kwargs) -> Proyecto:
        return self.repositorio.crear(Proyecto.crear(name=name, created_by_id=created_by_id, **kwargs))
