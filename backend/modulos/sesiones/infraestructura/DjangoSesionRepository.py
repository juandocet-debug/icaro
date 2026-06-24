from modulos.sesiones.dominio.SesionRepositoryPort import SesionRepositoryPort
from modulos.sesiones.dominio.Entidades import Sesion
from .models import SesionModel
from typing import List

class DjangoSesionRepository(SesionRepositoryPort):
    def registrar(self, s: Sesion) -> Sesion:
        obj = SesionModel.objects.create(
            id=s.id,
            usuario_id=s.usuario_id,
            token_jti=s.token_jti,
            ip_address=s.ip_address,
            user_agent=s.user_agent
        )
        s.created_at = obj.created_at
        return s

    def listar_por_usuario(self, usuario_id: int) -> List[Sesion]:
        objs = SesionModel.objects.filter(usuario_id=usuario_id)
        return [
            Sesion(
                id=o.id,
                usuario_id=o.usuario_id,
                token_jti=o.token_jti,
                ip_address=o.ip_address,
                user_agent=o.user_agent,
                created_at=o.created_at
            )
            for o in objs
        ]
