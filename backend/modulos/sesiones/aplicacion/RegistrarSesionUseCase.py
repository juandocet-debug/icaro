from modulos.sesiones.dominio.SesionRepositoryPort import SesionRepositoryPort
from modulos.sesiones.dominio.Entidades import Sesion
from typing import Optional

class RegistrarSesionUseCase:
    def __init__(self, repositorio: SesionRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, usuario_id: int, token_jti: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Sesion:
        if not token_jti.strip():
            raise ValueError("El token_jti no puede estar vacío.")
        sesion = Sesion.crear(usuario_id=usuario_id, token_jti=token_jti, ip_address=ip_address, user_agent=user_agent)
        return self.repositorio.registrar(sesion)
