from modulos.autenticacion.dominio.UsuarioRepositoryPort import UsuarioRepositoryPort

class ActualizarUsuarioUseCase:
    def __init__(self, repository: UsuarioRepositoryPort):
        self.repository = repository

    def ejecutar(self, superadmin_id: int, user_id: int, datos: dict):
        # Filtrar campos restringidos para evitar escalada de privilegios
        datos_limpios = datos.copy()
        datos_limpios.pop('is_superuser', None)
        datos_limpios.pop('is_staff', None)
        datos_limpios.pop('id', None)
        datos_limpios.pop('date_joined', None)

        is_active = datos_limpios.get('is_active')
        if is_active is not None and not bool(is_active):
            if int(superadmin_id) == int(user_id):
                raise ValueError("No puedes desactivarte a ti mismo.")

        return self.repository.actualizar(user_id, datos_limpios)
