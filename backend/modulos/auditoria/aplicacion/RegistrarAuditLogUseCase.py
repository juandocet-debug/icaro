from modulos.auditoria.dominio.AuditLogRepositoryPort import AuditLogRepositoryPort
from modulos.auditoria.dominio.Entidades import AuditLogEntidad

class RegistrarAuditLogUseCase:
    '''Caso de uso: persiste un registro de auditoria delegando al repositorio.'''
    def __init__(self, repositorio: AuditLogRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, accion: str, metodo_http: str, ruta: str, usuario_id: int = None,
                 ip_address: str = None, user_agent: str = None,
                 modelo_afectado: str = None, objeto_id: str = None,
                 payload_changes: dict = None) -> AuditLogEntidad:
        log = AuditLogEntidad.registrar(
            accion=accion, metodo_http=metodo_http, ruta=ruta,
            usuario_id=usuario_id, ip_address=ip_address, user_agent=user_agent,
            modelo_afectado=modelo_afectado, objeto_id=objeto_id,
            payload_changes=payload_changes,
        )
        return self.repositorio.registrar(log)
