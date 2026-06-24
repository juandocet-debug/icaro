from ..dominio.RolRepositoryPort import RolRepositoryPort

class EliminarRolUseCase:
    def __init__(self, repo: RolRepositoryPort):
        self.repo = repo

    def ejecutar(self, rol_id: str) -> bool:
        rol = self.repo.obtener_rol_por_id(rol_id)
        if not rol:
            raise ValueError("El rol no existe.")
        if rol.es_sistema:
            raise ValueError("No se pueden eliminar roles de sistema.")
        return self.repo.eliminar_rol(rol_id)
