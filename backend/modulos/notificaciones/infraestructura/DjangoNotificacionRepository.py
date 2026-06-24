from modulos.notificaciones.dominio.NotificacionRepositoryPort import NotificacionRepositoryPort
from modulos.notificaciones.dominio.Entidades import Notificacion
from .models import NotificacionModel
from typing import List
import uuid

class DjangoNotificacionRepository(NotificacionRepositoryPort):
    def registrar(self, n: Notificacion) -> Notificacion:
        obj = NotificacionModel.objects.create(
            id=n.id,
            usuario_id=n.usuario_id,
            mensaje=n.mensaje,
            leido=n.leido
        )
        n.created_at = obj.created_at
        return n

    def listar_por_usuario(self, usuario_id: int) -> List[Notificacion]:
        objs = NotificacionModel.objects.filter(usuario_id=usuario_id)
        return [
            Notificacion(id=o.id, usuario_id=o.usuario_id, mensaje=o.mensaje, leido=o.leido, created_at=o.created_at)
            for o in objs
        ]

    def obtener_por_id(self, notificacion_id: str) -> Notificacion:
        try:
            nid = uuid.UUID(notificacion_id) if isinstance(notificacion_id, str) else notificacion_id
            o = NotificacionModel.objects.get(id=nid)
            return Notificacion(id=o.id, usuario_id=o.usuario_id, mensaje=o.mensaje, leido=o.leido, created_at=o.created_at)
        except (NotificacionModel.DoesNotExist, ValueError):
            return None

    def marcar_como_leida(self, notificacion_id: str) -> bool:
        try:
            nid = uuid.UUID(notificacion_id)
            obj = NotificacionModel.objects.get(id=nid)
            obj.leido = True
            obj.save()
            return True
        except (NotificacionModel.DoesNotExist, ValueError):
            return False

    def marcar_como_leida_para_usuario(self, notificacion_id: str, user_id: int, es_admin: bool = False) -> bool:
        try:
            nid = uuid.UUID(notificacion_id) if isinstance(notificacion_id, str) else notificacion_id
            obj = NotificacionModel.objects.get(id=nid)
        except (NotificacionModel.DoesNotExist, ValueError):
            raise NotificacionModel.DoesNotExist("Notificación no encontrada.")
        
        if not es_admin and obj.usuario_id != user_id:
            raise PermissionError("No tienes permiso para marcar esta notificación como leída.")
        
        obj.leido = True
        obj.save()
        return True

