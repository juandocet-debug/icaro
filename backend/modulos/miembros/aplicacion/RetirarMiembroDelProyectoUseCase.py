from modulos.miembros.dominio.AsignacionMiembroRolRepositoryPort import AsignacionMiembroRolRepositoryPort

class RetirarMiembroDelProyectoUseCase:
    def __init__(self, repo: AsignacionMiembroRolRepositoryPort):
        self.repo = repo

    def ejecutar(self, proyecto_id: str, miembro_id: str):
        return self.repo.retirar_miembro_del_proyecto(proyecto_id=proyecto_id, miembro_id=miembro_id)
