from modulos.miembros.dominio.ProyectoMiembroRepositoryPort import ProyectoMiembroRepositoryPort
from modulos.miembros.dominio.Entidades import ProyectoMiembro
from .models import ProyectoMiembroModel

def _to_entity(obj: ProyectoMiembroModel) -> ProyectoMiembro:
    u = obj.usuario
    perfil = getattr(u, 'profile', None)
    nombre = f'{u.first_name} {u.last_name}'.strip() or u.username
    
    return ProyectoMiembro(
        id=str(obj.id), proyecto_id=str(obj.proyecto_id),
        usuario_id=u.id, username=u.username, email=u.email,
        nombre_completo=nombre,
        cargo=perfil.cargo if perfil else None,
        agregado_por_id=obj.agregado_por_id,
    )

class DjangoProyectoMiembroRepository(ProyectoMiembroRepositoryPort):
    def listar(self, proyecto_id: str):
        qs = (ProyectoMiembroModel.objects
              .filter(proyecto_id=proyecto_id)
              .select_related('usuario', 'usuario__profile')
              .order_by('created_at'))
        return [_to_entity(o) for o in qs]

    def obtener(self, miembro_id: str, proyecto_id: str):
        try:
            obj = (ProyectoMiembroModel.objects
                   .select_related('usuario', 'usuario__profile')
                   .get(id=miembro_id, proyecto_id=proyecto_id))
            return _to_entity(obj)
        except ProyectoMiembroModel.DoesNotExist:
            return None

    def existe(self, proyecto_id: str, usuario_id: int) -> bool:
        return ProyectoMiembroModel.objects.filter(
            proyecto_id=proyecto_id, usuario_id=usuario_id).exists()
