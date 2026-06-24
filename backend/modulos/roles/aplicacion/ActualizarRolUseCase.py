from typing import List
from ..dominio.RolRepositoryPort import RolRepositoryPort
from ..dominio.Entidades import Rol

class ActualizarRolUseCase:
    def __init__(self, repo: RolRepositoryPort):
        self.repo = repo

    def ejecutar(self, rol_id: str, nombre: str, descripcion: str, permisos: List[str]) -> Rol:
        rol = self.repo.obtener_rol_por_id(rol_id)
        if not rol:
            raise ValueError("El rol no existe.")
        if rol.es_sistema:
            raise ValueError("No se pueden editar roles del sistema.")
        
        # Validar nombre único si cambió
        if rol.nombre.lower() != nombre.strip().lower():
            dup = self.repo.obtener_rol_por_nombre(nombre)
            if dup and dup.id != rol.id:
                raise ValueError("Ya existe otro rol con ese nombre.")

        rol.nombre = nombre.strip()
        rol.descripcion = descripcion.strip()
        return self.repo.actualizar_rol(rol, permisos)
