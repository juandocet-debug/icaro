from modulos.componentes.dominio.ComponenteRepositoryPort import ComponenteRepositoryPort
class ObtenerComponenteUseCase:
    def __init__(self, repositorio: ComponenteRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str):
        return self.repositorio.obtener_por_id(id)
