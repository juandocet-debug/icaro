from modulos.notificaciones.dominio.NotificacionRepositoryPort import NotificacionRepositoryPort
from modulos.notificaciones.dominio.Entidades import Notificacion
from typing import List

class ListarNotificacionesUseCase:
    def __init__(self, repositorio: NotificacionRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, usuario_id: int) -> List[Notificacion]:
        return self.repositorio.listar_por_usuario(usuario_id)
