from typing import Optional, List
from modulos.proyectos.dominio.ProyectoRepositoryPort import ProyectoRepositoryPort
from modulos.proyectos.dominio.Entidades import Proyecto
from .models import ProyectoModel

class DjangoProyectoRepository(ProyectoRepositoryPort):
    def _to_entity(self, obj) -> Proyecto:
        return Proyecto(id=str(obj.id), name=obj.name, created_by_id=obj.created_by_id,
                        contract_number=obj.contract_number, contract_object=obj.contract_object, description=obj.description,
                        start_date=obj.start_date, end_date=obj.end_date,
                        status=obj.status, public_access_token=obj.public_access_token)
    def crear(self, p: Proyecto) -> Proyecto:
        obj = ProyectoModel.objects.create(id=p.id, name=p.name, created_by_id=p.created_by_id,
            contract_number=p.contract_number, contract_object=p.contract_object, description=p.description,
            start_date=p.start_date, end_date=p.end_date, status=p.status,
            public_access_token=p.public_access_token)
        return self._to_entity(obj)
    def obtener_por_id(self, id: str) -> Optional[Proyecto]:
        try: return self._to_entity(ProyectoModel.objects.get(id=id))
        except ProyectoModel.DoesNotExist: return None
    def obtener_por_id_para_usuario(self, id: str, user_id: str) -> Optional[Proyecto]:
        """
        Retorna el proyecto solo si el usuario tiene una asignación ACTIVA en él
        (fuente única de verdad: UsuarioRolModel activo).
        No utiliza created_by_id como criterio de autorización para lectura.
        """
        from modulos.roles.infraestructura.models import UsuarioRolModel
        tiene_asignacion = UsuarioRolModel.objects.filter(
            usuario_id=user_id,
            proyecto_id=id,
            activo=True,
        ).exists()
        if not tiene_asignacion:
            return None
        try:
            return self._to_entity(ProyectoModel.objects.get(id=id))
        except ProyectoModel.DoesNotExist:
            return None

    def contar(self) -> int:
        return ProyectoModel.objects.count()
    def contar_por_usuario(self, user_id: str) -> int:
        from modulos.roles.infraestructura.models import UsuarioRolModel
        proyecto_ids = UsuarioRolModel.objects.filter(
            usuario_id=user_id,
            activo=True,
            proyecto__isnull=False,
        ).values_list('proyecto_id', flat=True).distinct()
        return ProyectoModel.objects.filter(id__in=proyecto_ids).count()
    def listar(self, limit: int = 20, offset: int = 0) -> List[Proyecto]:
        qs = ProyectoModel.objects.all().order_by('-created_at')[offset:offset+limit]
        return [self._to_entity(o) for o in qs]
    def listar_por_usuario(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Proyecto]:
        from modulos.roles.infraestructura.models import UsuarioRolModel
        proyecto_ids = UsuarioRolModel.objects.filter(
            usuario_id=user_id,
            activo=True,
            proyecto__isnull=False,
        ).values_list('proyecto_id', flat=True).distinct()
        qs = ProyectoModel.objects.filter(
            id__in=proyecto_ids,
        ).order_by('-created_at')[offset:offset + limit]
        return [self._to_entity(o) for o in qs]
    def actualizar(self, p: Proyecto) -> Proyecto:
        ProyectoModel.objects.filter(id=p.id).update(
            name=p.name, contract_number=p.contract_number, contract_object=p.contract_object, description=p.description,
            start_date=p.start_date, end_date=p.end_date, status=p.status)
        return self.obtener_por_id(p.id)
    def eliminar(self, id: str) -> bool:
        deleted, _ = ProyectoModel.objects.filter(id=id).delete()
        return deleted > 0
