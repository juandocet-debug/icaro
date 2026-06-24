from modulos.miembros.dominio.AsignacionMiembroRolRepositoryPort import AsignacionMiembroRolRepositoryPort

class RetirarRolDeMiembroUseCase:
    def __init__(self, repo: AsignacionMiembroRolRepositoryPort):
        self.repo = repo

    def ejecutar(self, proyecto_id: str, asignacion_id: str):
        return self.repo.retirar_rol_de_miembro(proyecto_id=proyecto_id, asignacion_id=asignacion_id)
