from modulos.acciones.dominio.AsignacionResponsable import AsignacionResponsable
from modulos.acciones.dominio.AsignacionResponsableRepositoryPort import AsignacionResponsableRepositoryPort


class AsignarResponsableAccionUseCase:
    def __init__(self, repo: AsignacionResponsableRepositoryPort):
        self.repo = repo

    def ejecutar(self, accion_id: str, usuario_id: int, tipo_asignacion: str,
                 assigned_by_id: int) -> AsignacionResponsable:
        if tipo_asignacion not in ('responsable', 'apoyo'):
            raise ValueError("El tipo de asignación debe ser 'responsable' o 'apoyo'.")

        # Toda la validación ORM está encapsulada en el repositorio
        self.repo.validar_asignacion_posible(accion_id, usuario_id)

        asignacion = AsignacionResponsable(
            id=None,
            accion_id=accion_id,
            usuario_id=usuario_id,
            tipo_asignacion=tipo_asignacion,
            activo=True,
            assigned_by_id=assigned_by_id,
        )
        return self.repo.guardar(asignacion)
