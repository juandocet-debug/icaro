from modulos.autenticacion.dominio.UsuarioRepositoryPort import UsuarioRepositoryPort

class EliminarUsuarioUseCase:
    def __init__(self, repository: UsuarioRepositoryPort):
        self.repository = repository

    def ejecutar(self, superadmin_id: int, user_id: int):
        if int(superadmin_id) == int(user_id):
            raise ValueError("No puedes eliminarte a ti mismo.")

        user = self.repository.obtener_por_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado.")

        if getattr(user, 'is_superuser', False):
            raise ValueError("No puedes eliminar a otro superadministrador.")

        self.repository.eliminar(user_id, superadmin_id)
