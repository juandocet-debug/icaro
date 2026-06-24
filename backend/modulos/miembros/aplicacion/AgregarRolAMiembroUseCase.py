from modulos.miembros.dominio.AsignacionMiembroRolRepositoryPort import AsignacionMiembroRolRepositoryPort

class AgregarRolAMiembroUseCase:
    def __init__(self, repo: AsignacionMiembroRolRepositoryPort):
        self.repo = repo

    def ejecutar(
        self,
        proyecto_id: str,
        usuario_id: int,
        rol_id: str,
        componente_id: str = None,
        accion_id: str = None,
        agregado_por_id: int = None
    ):
        return self.repo.agregar_rol_a_miembro(
            proyecto_id=proyecto_id,
            usuario_id=usuario_id,
            rol_id=rol_id,
            componente_id=componente_id,
            accion_id=accion_id,
            agregado_por_id=agregado_por_id
        )
