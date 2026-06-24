from modulos.proyectos.dominio.ProyectoRepositoryPort import ProyectoRepositoryPort
class ListarProyectosUseCase:
    def __init__(self, repositorio: ProyectoRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, user_id: str = None, es_admin: bool = False, limit: int = 20, offset: int = 0):
        if es_admin:
            total = self.repositorio.contar()
            items = self.repositorio.listar(limit=limit, offset=offset)
        else:
            total = self.repositorio.contar_por_usuario(user_id)
            items = self.repositorio.listar_por_usuario(user_id, limit=limit, offset=offset)
        return {"total": total, "items": items}
