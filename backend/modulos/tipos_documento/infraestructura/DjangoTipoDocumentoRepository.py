from typing import List
from ..dominio.TipoDocumentoRepositoryPort import TipoDocumentoRepositoryPort
from ..dominio.Entidades import TipoDocumentoEntidad
from .models import TipoDocumentoModel

class DjangoTipoDocumentoRepository(TipoDocumentoRepositoryPort):

    def _to_entity(self, obj) -> TipoDocumentoEntidad:
        return TipoDocumentoEntidad(
            id=str(obj.id), proyecto_id=str(obj.proyecto_id),
            nombre=obj.nombre, descripcion=obj.descripcion,
            orden=obj.orden, creado_por_id=obj.creado_por_id)

    def crear(self, entidad: TipoDocumentoEntidad) -> TipoDocumentoEntidad:
        obj = TipoDocumentoModel.objects.create(
            id=entidad.id, proyecto_id=entidad.proyecto_id,
            nombre=entidad.nombre, descripcion=entidad.descripcion,
            orden=entidad.orden, creado_por_id=entidad.creado_por_id)
        return self._to_entity(obj)

    def listar_por_proyecto(self, proyecto_id: str) -> List[TipoDocumentoEntidad]:
        return [self._to_entity(o)
                for o in TipoDocumentoModel.objects.filter(proyecto_id=proyecto_id)]

    def eliminar(self, tipo_id: str, proyecto_id: str) -> bool:
        deleted, _ = TipoDocumentoModel.objects.filter(
            id=tipo_id, proyecto_id=proyecto_id).delete()
        return deleted > 0

    def actualizar(self, tipo_id: str, proyecto_id: str,
                   nombre: str, descripcion: str = None) -> TipoDocumentoEntidad:
        updated = TipoDocumentoModel.objects.filter(
            id=tipo_id, proyecto_id=proyecto_id
        ).update(nombre=nombre, descripcion=descripcion)
        if not updated:
            raise ValueError('Tipo de documento no encontrado.')
        return self._to_entity(
            TipoDocumentoModel.objects.get(id=tipo_id))
