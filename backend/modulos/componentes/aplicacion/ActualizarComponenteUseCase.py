from modulos.componentes.dominio.ComponenteRepositoryPort import ComponenteRepositoryPort
class ActualizarComponenteUseCase:
    def __init__(self, repositorio: ComponenteRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str, **campos):
        c = self.repositorio.obtener_por_id(id)
        if not c: raise ValueError(f'Componente {id} no encontrado.')
        for k, v in campos.items():
            if hasattr(c, k) and v is not None: setattr(c, k, v)
        return self.repositorio.actualizar(c)
