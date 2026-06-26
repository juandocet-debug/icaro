from modulos.acciones.infraestructura.models import AccionGrupoModel
from modulos.evidencias.infraestructura.models import EvidenciaActividadModel

class DesactivarGrupoAccionUseCase:
    def ejecutar(self, grupo_id: str) -> tuple:
        """
        Returns (grupo, deleted_physically: bool)
        """
        try:
            grupo = AccionGrupoModel.objects.get(pk=grupo_id)
        except AccionGrupoModel.DoesNotExist:
            raise ValueError("El grupo especificado no existe.")

        # Check if any EvidenciaActividadModel references this group
        has_evidences = EvidenciaActividadModel.objects.filter(grupo_id=grupo_id).exists()
        
        if has_evidences:
            grupo.activo = False
            grupo.save()
            return grupo, False
        else:
            grupo.delete()
            return None, True
