from typing import Optional, List
from modulos.acciones.dominio.AccionRepositoryPort import AccionRepositoryPort
from modulos.acciones.dominio.Entidades import Accion
from .models import AccionModel

class DjangoAccionRepository(AccionRepositoryPort):
    def _to_entity(self, obj) -> Accion:
        return Accion(id=str(obj.id), componente_id=str(obj.component_id), name=obj.name,
                      description=obj.description, action_type=obj.action_type,
                      total_sessions=obj.total_sessions, proyeccion_cuantitativa=obj.proyeccion_cuantitativa,
                      unidad_medida=obj.unidad_medida, ejecucion_acumulada=obj.ejecucion_acumulada, is_transversal=obj.is_transversal,
                      display_order=obj.display_order, start_date=obj.start_date, end_date=obj.end_date)
    def crear(self, a: Accion) -> Accion:
        obj = AccionModel.objects.create(id=a.id, component_id=a.componente_id, name=a.name,
            description=a.description, action_type=a.action_type, total_sessions=a.total_sessions,
            proyeccion_cuantitativa=a.proyeccion_cuantitativa, unidad_medida=a.unidad_medida,
            ejecucion_acumulada=a.ejecucion_acumulada,
            is_transversal=a.is_transversal, display_order=a.display_order,
            start_date=a.start_date or None, end_date=a.end_date or None)
        return self._to_entity(obj)
    def obtener_por_id(self, id: str) -> Optional[Accion]:
        try: return self._to_entity(AccionModel.objects.get(id=id))
        except AccionModel.DoesNotExist: return None
    def listar_por_componente(self, componente_id: str) -> List[Accion]:
        return [self._to_entity(o) for o in AccionModel.objects.filter(component_id=componente_id)]
    def actualizar(self, a: Accion) -> Accion:
        AccionModel.objects.filter(id=a.id).update(
            name=a.name, description=a.description, action_type=a.action_type,
            total_sessions=a.total_sessions, proyeccion_cuantitativa=a.proyeccion_cuantitativa,
            unidad_medida=a.unidad_medida, ejecucion_acumulada=a.ejecucion_acumulada,
            is_transversal=a.is_transversal, display_order=a.display_order,
            start_date=a.start_date or None, end_date=a.end_date or None)
        return self.obtener_por_id(a.id)
    def eliminar(self, id: str) -> bool:
        deleted, _ = AccionModel.objects.filter(id=id).delete()
        return deleted > 0
