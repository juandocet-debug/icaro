from typing import Optional
from modulos.autenticacion.dominio.ProfileRepositoryPort import ProfileRepositoryPort
from modulos.autenticacion.dominio.Entidades import ProfileEntidad
from .models import ProfileModel

class DjangoProfileRepository(ProfileRepositoryPort):
    def _to_entity(self, obj):
        return ProfileEntidad(id=str(obj.id), user_id=obj.user_id, telefono=obj.telefono,
                              cargo=obj.cargo, organizacion_id=str(obj.organizacion_id) if obj.organizacion_id else None)
    def obtener_por_user_id(self, user_id: int) -> Optional[ProfileEntidad]:
        try:
            return self._to_entity(ProfileModel.objects.get(user_id=user_id))
        except ProfileModel.DoesNotExist:
            return None
    def actualizar(self, profile: ProfileEntidad) -> ProfileEntidad:
        ProfileModel.objects.filter(user_id=profile.user_id).update(
            telefono=profile.telefono, cargo=profile.cargo, organizacion_id=profile.organizacion_id)
        return self.obtener_por_user_id(profile.user_id)
