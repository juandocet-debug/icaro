from modulos.acciones.dominio.AsignacionResponsableRepositoryPort import AsignacionResponsableRepositoryPort


class ListarMisActividadesUseCase:
    def __init__(self, repo: AsignacionResponsableRepositoryPort):
        self.repo = repo

    def ejecutar(self, usuario, q: str = "", estado: str = "", proyecto_id: str = ""):
        return self.repo.listar_acciones_para_usuario(
            usuario_id=usuario.id,
            es_superuser=usuario.is_superuser,
            q=q,
            estado=estado,
            proyecto_id=proyecto_id,
        )
