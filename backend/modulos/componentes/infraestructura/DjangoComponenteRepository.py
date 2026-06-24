from typing import Optional, List
from modulos.componentes.dominio.ComponenteRepositoryPort import ComponenteRepositoryPort
from modulos.componentes.dominio.Entidades import Componente
from .models import ComponenteModel

class DjangoComponenteRepository(ComponenteRepositoryPort):
    def _validar_meta_proyecto(self, proyecto_id: str, meta_id: str):
        if not meta_id:
            raise ValueError("La meta es obligatoria para el componente.")
        from modulos.metas.infraestructura.models import MetaModel
        try:
            meta = MetaModel.objects.get(id=meta_id)
            if str(meta.proyecto_id) != str(proyecto_id):
                raise ValueError("Un componente no puede apuntar a una meta de otro proyecto.")
            if not meta.activo:
                raise ValueError("La meta seleccionada está archivada.")
        except MetaModel.DoesNotExist:
            raise ValueError("La meta especificada no existe.")

    def _to_entity(self, obj) -> Componente:
        return Componente(id=str(obj.id), proyecto_id=str(obj.project_id), meta_id=str(obj.meta_id), name=obj.name,
                          description=obj.description, display_order=obj.display_order)

    def crear(self, c: Componente) -> Componente:
        self._validar_meta_proyecto(c.proyecto_id, c.meta_id)
        obj = ComponenteModel.objects.create(id=c.id, project_id=c.proyecto_id, meta_id=c.meta_id, name=c.name,
            description=c.description, display_order=c.display_order)
        return self._to_entity(obj)

    def obtener_por_id(self, id: str) -> Optional[Componente]:
        try: return self._to_entity(ComponenteModel.objects.get(id=id))
        except ComponenteModel.DoesNotExist: return None

    def listar_por_proyecto(self, proyecto_id: str) -> List[Componente]:
        return [self._to_entity(o) for o in ComponenteModel.objects.filter(project_id=proyecto_id)]

    def actualizar(self, c: Componente) -> Componente:
        self._validar_meta_proyecto(c.proyecto_id, c.meta_id)
        ComponenteModel.objects.filter(id=c.id).update(
            meta_id=c.meta_id, name=c.name, description=c.description, display_order=c.display_order)
        return self.obtener_por_id(c.id)
    def eliminar(self, id: str) -> bool:
        deleted, _ = ComponenteModel.objects.filter(id=id).delete()
        return deleted > 0
