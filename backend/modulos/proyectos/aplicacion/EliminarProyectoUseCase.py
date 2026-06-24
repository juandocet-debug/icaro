from modulos.proyectos.dominio.ProyectoRepositoryPort import ProyectoRepositoryPort
class EliminarProyectoUseCase:
    def __init__(self, repositorio: ProyectoRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, id: str, user_id: str = None, es_admin: bool = False) -> bool:
        p = self.repositorio.obtener_por_id(id)
        if not p:
            raise ValueError(f"Proyecto {id} no encontrado.")
        if not es_admin and p.created_by_id != user_id:
            raise PermissionError("No tienes permiso para eliminar este proyecto.")
        return self.repositorio.eliminar(id)
