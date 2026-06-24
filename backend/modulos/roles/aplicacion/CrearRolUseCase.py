from typing import List
from ..dominio.RolRepositoryPort import RolRepositoryPort
from ..dominio.Entidades import Rol

class CrearRolUseCase:
    def __init__(self, repo: RolRepositoryPort):
        self.repo = repo

    def ejecutar(self, nombre: str, descripcion: str, permisos: List[str]) -> Rol:
        if self.repo.obtener_rol_por_nombre(nombre):
            raise ValueError("Ya existe un rol con ese nombre.")
        import re
        codigo = re.sub(r'[^a-z0-9_]', '', nombre.strip().lower().replace(' ', '_'))
        if not codigo:
            raise ValueError("El nombre genera un código inválido.")
        if self.repo.obtener_rol_por_codigo(codigo):
            raise ValueError("Ya existe un rol con ese código.")
        rol = Rol.crear(codigo=codigo, nombre=nombre, descripcion=descripcion, es_sistema=False)
        return self.repo.crear_rol(rol, permisos)
