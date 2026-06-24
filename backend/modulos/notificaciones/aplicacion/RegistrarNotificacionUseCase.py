from modulos.notificaciones.dominio.NotificacionRepositoryPort import NotificacionRepositoryPort
from modulos.notificaciones.dominio.Entidades import Notificacion

class RegistrarNotificacionUseCase:
    def __init__(self, repositorio: NotificacionRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, usuario_id: int, mensaje: str) -> Notificacion:
        if not mensaje.strip():
            raise ValueError("El mensaje no puede estar vacío.")
        notificacion = Notificacion.crear(usuario_id=usuario_id, mensaje=mensaje)
        return self.repositorio.registrar(notificacion)
