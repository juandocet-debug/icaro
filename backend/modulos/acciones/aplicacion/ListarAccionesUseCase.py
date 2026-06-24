from modulos.acciones.dominio.AccionRepositoryPort import AccionRepositoryPort
class ListarAccionesUseCase:
    def __init__(self, repositorio: AccionRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, componente_id: str):
        return self.repositorio.listar_por_componente(componente_id)
