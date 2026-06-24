from modulos.autenticacion.dominio.ProfileRepositoryPort import ProfileRepositoryPort
from modulos.autenticacion.dominio.Entidades import ProfileEntidad

class ActualizarPerfilUseCase:
    def __init__(self, repositorio: ProfileRepositoryPort):
        self.repositorio = repositorio
    def ejecutar(self, user_id: int, telefono: str = None, cargo: str = None, organizacion_id: str = None) -> ProfileEntidad:
        perfil = self.repositorio.obtener_por_user_id(user_id)
        if not perfil:
            raise ValueError(f'No existe perfil para el usuario {user_id}')
        if telefono is not None: perfil.telefono = telefono
        if cargo is not None: perfil.cargo = cargo
        if organizacion_id is not None: perfil.organizacion_id = organizacion_id
        return self.repositorio.actualizar(perfil)
