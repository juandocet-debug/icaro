from modulos.proyectos.dominio.ProyectoRepositoryPort import ProyectoRepositoryPort


class ObtenerProyectoUseCase:
    def __init__(self, repositorio: ProyectoRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, id: str, user_id: str = None, es_admin: bool = False):
        """
        Devuelve el proyecto si el usuario tiene autorización.

        Política de acceso al detalle (fuente única de verdad: UsuarioRolModel activo):
          - Superadministrador (es_admin=True): acceso irrestricto.
          - Usuario operativo: solo si tiene asignación activa en el proyecto
            (delegado a obtener_por_id_para_usuario que verifica UsuarioRolModel).
          - Nunca se usa created_by_id como criterio de autorización para lectura.
        """
        if es_admin:
            p = self.repositorio.obtener_por_id(id)
            if not p:
                raise ValueError(f"Proyecto {id} no encontrado.")
            return p

        # Usuario operativo: la autorización es via UsuarioRolModel activo
        p = self.repositorio.obtener_por_id_para_usuario(id, user_id)
        if not p:
            raise PermissionError("No tienes permiso para acceder a este proyecto.")
        return p
