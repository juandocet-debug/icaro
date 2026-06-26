from django.db.models import Q
from modulos.acciones.infraestructura.models import AccionGrupoModel

class ListarGruposAccionUseCase:
    def ejecutar(self, accion_id: str, q: str = "", activo: bool = None):
        qs = AccionGrupoModel.objects.filter(accion_id=accion_id)
        
        if activo is not None:
            qs = qs.filter(activo=activo)
            
        if q:
            q_clean = q.strip()
            qs = qs.filter(
                Q(nombre__icontains=q_clean) | Q(codigo__icontains=q_clean)
            )
            
        return qs.order_by('nombre', 'created_at')
