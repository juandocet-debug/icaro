from modulos.acciones.dominio.AccionRepositoryPort import AccionRepositoryPort
class ObtenerAccionUseCase:
    def __init__(self, repositorio: AccionRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str):
        return self.repositorio.obtener_por_id(id)
