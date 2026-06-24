from typing import List, Optional

from django.db.models import Count
from modulos.metas.dominio.Entidades import Meta
from modulos.metas.dominio.MetaRepositoryPort import MetaRepositoryPort
from .models import MetaModel


class DjangoMetaRepository(MetaRepositoryPort):
    @staticmethod
    def _to_entity(obj):
        return Meta(id=str(obj.id), proyecto_id=str(obj.proyecto_id), nombre=obj.nombre,
                    descripcion=obj.descripcion, activo=obj.activo,
                    created_by_id=obj.created_by_id, updated_by_id=obj.updated_by_id)

    def listar_por_proyecto_con_conteos(self, proyecto_id: str, incluir_archivadas: bool = False):
        qs = MetaModel.objects.filter(proyecto_id=proyecto_id)
        if not incluir_archivadas:
            qs = qs.filter(activo=True)
        return (
            qs.annotate(
                cantidad_componentes=Count('componentes', distinct=True),
                cantidad_acciones=Count('componentes__acciones', distinct=True),
            ).order_by('created_at')
        )

    def crear(self, meta: Meta) -> Meta:
        return self._to_entity(MetaModel.objects.create(
            id=meta.id, proyecto_id=meta.proyecto_id, nombre=meta.nombre,
            descripcion=meta.descripcion, activo=meta.activo, created_by_id=meta.created_by_id))

    def obtener_por_id(self, id: str) -> Optional[Meta]:
        try:
            return self._to_entity(MetaModel.objects.get(id=id))
        except MetaModel.DoesNotExist:
            return None

    def listar_por_proyecto(self, proyecto_id: str, incluir_archivadas: bool = False) -> List[Meta]:
        queryset = MetaModel.objects.filter(proyecto_id=proyecto_id)
        if not incluir_archivadas:
            queryset = queryset.filter(activo=True)
        return [self._to_entity(item) for item in queryset]

    def actualizar(self, meta: Meta) -> Meta:
        MetaModel.objects.filter(id=meta.id).update(nombre=meta.nombre, descripcion=meta.descripcion,
                                                     activo=meta.activo, updated_by_id=meta.updated_by_id)
        return self.obtener_por_id(meta.id)

    def eliminar(self, id: str) -> bool:
        deleted, _ = MetaModel.objects.filter(id=id).delete()
        return deleted > 0

    def existen_componentes_por_meta(self, meta_id: str) -> bool:
        from modulos.componentes.infraestructura.models import ComponenteModel
        return ComponenteModel.objects.filter(meta_id=meta_id).exists()
