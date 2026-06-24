from modulos.miembros.dominio.AsignacionMiembroRolRepositoryPort import AsignacionMiembroRolRepositoryPort

class ActualizarAsignacionRolUseCase:
    def __init__(self, repo: AsignacionMiembroRolRepositoryPort):
        self.repo = repo

    def ejecutar(
        self,
        proyecto_id: str,
        asignacion_id: str,
        rol_id: str,
        componente_id: str = None,
        accion_id: str = None
    ):
        return self.repo.actualizar_asignacion_rol(
            proyecto_id=proyecto_id,
            asignacion_id=asignacion_id,
            rol_id=rol_id,
            componente_id=componente_id,
            accion_id=accion_id
        )
