from modulos.acciones.dominio.AccionRepositoryPort import AccionRepositoryPort
class EliminarAccionUseCase:
    def __init__(self, repositorio: AccionRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str) -> bool:
        return self.repositorio.eliminar(id)
