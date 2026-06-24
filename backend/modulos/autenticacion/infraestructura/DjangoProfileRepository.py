from typing import Optional
from modulos.autenticacion.dominio.ProfileRepositoryPort import ProfileRepositoryPort
from modulos.autenticacion.dominio.Entidades import ProfileEntidad
from .models import ProfileModel

class DjangoProfileRepository(ProfileRepositoryPort):
    def _to_entity(self, obj):
        return ProfileEntidad(id=str(obj.id), user_id=obj.user_id, telefono=obj.telefono,
                              cargo=obj.cargo, organizacion_id=str(obj.organizacion_id) if obj.organizacion_id else None,
                              primer_nombre=obj.primer_nombre, segundo_nombre=obj.segundo_nombre,
                              primer_apellido=obj.primer_apellido, segundo_apellido=obj.segundo_apellido)
    def obtener_por_user_id(self, user_id: int) -> Optional[ProfileEntidad]:
        try:
            return self._to_entity(ProfileModel.objects.get(user_id=user_id))
        except ProfileModel.DoesNotExist:
            return None
    def actualizar(self, profile: ProfileEntidad) -> ProfileEntidad:
        obj = ProfileModel.objects.get(user_id=profile.user_id)
        obj.telefono = profile.telefono
        obj.cargo = profile.cargo
        obj.organizacion_id = profile.organizacion_id
        obj.primer_nombre = profile.primer_nombre
        obj.segundo_nombre = profile.segundo_nombre
        obj.primer_apellido = profile.primer_apellido
        obj.segundo_apellido = profile.segundo_apellido
        obj.save()
        return self._to_entity(obj)
