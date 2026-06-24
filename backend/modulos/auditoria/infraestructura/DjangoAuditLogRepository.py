from modulos.auditoria.dominio.AuditLogRepositoryPort import AuditLogRepositoryPort
from modulos.auditoria.dominio.Entidades import AuditLogEntidad
from .models import AuditLogModel

class DjangoAuditLogRepository(AuditLogRepositoryPort):
    def registrar(self, log: AuditLogEntidad) -> AuditLogEntidad:
        AuditLogModel.objects.create(
            id=log.id, usuario_id=log.usuario_id, accion=log.accion,
            metodo_http=log.metodo_http, ruta=log.ruta, ip_address=log.ip_address,
            user_agent=log.user_agent, modelo_afectado=log.modelo_afectado,
            objeto_id=log.objeto_id, payload_changes=log.payload_changes,
        )
        return log
