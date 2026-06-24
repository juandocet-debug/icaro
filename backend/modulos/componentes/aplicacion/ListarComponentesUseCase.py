from modulos.componentes.dominio.ComponenteRepositoryPort import ComponenteRepositoryPort
class ListarComponentesUseCase:
    def __init__(self, repositorio: ComponenteRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, proyecto_id: str):
        return self.repositorio.listar_por_proyecto(proyecto_id)
