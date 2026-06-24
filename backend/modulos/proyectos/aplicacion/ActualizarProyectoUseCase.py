from modulos.proyectos.dominio.ProyectoRepositoryPort import ProyectoRepositoryPort
class ActualizarProyectoUseCase:
    def __init__(self, repositorio: ProyectoRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str, user_id: str = None, es_admin: bool = False, **campos):
        p = self.repositorio.obtener_por_id(id)
        if not p: raise ValueError(f'Proyecto {id} no encontrado.')
        if not es_admin and p.created_by_id != user_id:
            raise PermissionError("No tienes permiso para actualizar este proyecto.")
        for k, v in campos.items():
            if hasattr(p, k) and v is not None: setattr(p, k, v)
        return self.repositorio.actualizar(p)
