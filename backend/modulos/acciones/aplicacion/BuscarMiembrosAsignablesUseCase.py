from modulos.acciones.dominio.AsignacionResponsableRepositoryPort import AsignacionResponsableRepositoryPort


class BuscarMiembrosAsignablesUseCase:
    def __init__(self, repo: AsignacionResponsableRepositoryPort):
        self.repo = repo

    def ejecutar(self, accion_id: str, q: str = "") -> list:
        return self.repo.buscar_miembros_asignables(accion_id, q)
