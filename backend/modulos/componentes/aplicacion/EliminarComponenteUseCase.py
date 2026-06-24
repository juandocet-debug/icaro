from modulos.componentes.dominio.ComponenteRepositoryPort import ComponenteRepositoryPort
class EliminarComponenteUseCase:
    def __init__(self, repositorio: ComponenteRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str) -> bool:
        return self.repositorio.eliminar(id)
