from typing import Optional, List
from modulos.organizaciones.dominio.OrganizacionRepositoryPort import OrganizacionRepositoryPort
from modulos.organizaciones.dominio.Entidades import Organizacion
from .models import OrganizacionModel


class DjangoOrganizacionRepository(OrganizacionRepositoryPort):
    """Implementación del puerto de repositorio usando Django ORM."""

    def _to_entity(self, obj: OrganizacionModel) -> Organizacion:
        return Organizacion(
            id=str(obj.id),
            nombre=obj.nombre,
            sigla=obj.sigla,
            nit=obj.nit,
            activo=obj.activo,
        )

    def crear(self, organizacion: Organizacion) -> Organizacion:
        obj = OrganizacionModel.objects.create(
            id=organizacion.id,
            nombre=organizacion.nombre,
            sigla=organizacion.sigla,
            nit=organizacion.nit,
            activo=organizacion.activo,
        )
        return self._to_entity(obj)

    def obtener_por_id(self, id: str) -> Optional[Organizacion]:
        try:
            obj = OrganizacionModel.objects.get(id=id)
            return self._to_entity(obj)
        except OrganizacionModel.DoesNotExist:
            return None

    def listar(self, solo_activas: bool = True) -> List[Organizacion]:
        qs = OrganizacionModel.objects.all()
        if solo_activas:
            qs = qs.filter(activo=True)
        return [self._to_entity(o) for o in qs.order_by('nombre')]

    def actualizar(self, organizacion: Organizacion) -> Organizacion:
        OrganizacionModel.objects.filter(id=organizacion.id).update(
            nombre=organizacion.nombre,
            sigla=organizacion.sigla,
            nit=organizacion.nit,
            activo=organizacion.activo,
        )
        return self.obtener_por_id(organizacion.id)

    def eliminar(self, id: str) -> bool:
        updated = OrganizacionModel.objects.filter(id=id).update(activo=False)
        return updated > 0
