from modulos.acciones.dominio.AccionRepositoryPort import AccionRepositoryPort
class ActualizarAccionUseCase:
    def __init__(self, repositorio: AccionRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str, **campos):
        a = self.repositorio.obtener_por_id(id)
        if not a: raise ValueError(f'Accion {id} no encontrada.')
        for k, v in campos.items():
            if hasattr(a, k) and v is not None: setattr(a, k, v)
        return self.repositorio.actualizar(a)
