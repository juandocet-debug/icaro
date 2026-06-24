from modulos.acciones.dominio.AsignacionResponsableRepositoryPort import AsignacionResponsableRepositoryPort
from modulos.acciones.infraestructura.models import AsignacionResponsableAccionModel

class RetirarResponsableAccionUseCase:
    def __init__(self, repo: AsignacionResponsableRepositoryPort):
        self.repo = repo

    def ejecutar(self, asignacion_id: str) -> None:
        try:
            obj = AsignacionResponsableAccionModel.objects.get(pk=asignacion_id, activo=True)
        except AsignacionResponsableAccionModel.DoesNotExist:
            raise ValueError("Asignación activa no encontrada.")

        obj.activo = False
        obj.save(update_fields=['activo', 'updated_at'])
