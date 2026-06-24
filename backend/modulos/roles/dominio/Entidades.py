from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
import uuid

@dataclass
class Permiso:
    codigo: str
    nombre: str
    modulo: str
    descripcion: Optional[str] = None

    @classmethod
    def crear(cls, codigo: str, nombre: str, modulo: str, descripcion: Optional[str] = None) -> 'Permiso':
        if not codigo or not codigo.strip():
            raise ValueError("El código de permiso es obligatorio.")
        return cls(codigo=codigo.strip(), nombre=nombre.strip(), modulo=modulo.strip(), descripcion=descripcion)


@dataclass
class Rol:
    id: str
    codigo: str
    nombre: str
    descripcion: str
    es_sistema: bool = False
    activo: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    permisos: Optional[List[str]] = None  # Lista de códigos de permiso
    cantidad_usuarios: int = 0
    tipo_alcance: str = 'proyecto'  # 'global', 'proyecto', 'componente', 'accion', 'publico'

    @classmethod
    def crear(cls, codigo: str, nombre: str, descripcion: str, es_sistema: bool = False, activo: bool = True, tipo_alcance: str = 'proyecto') -> 'Rol':
        if not codigo or not codigo.strip():
            raise ValueError("El código del rol es obligatorio.")
        if not nombre or not nombre.strip():
            raise ValueError("El nombre del rol es obligatorio.")
        if not descripcion or not descripcion.strip():
            raise ValueError("La descripción del rol es obligatoria.")
        return cls(
            id=str(uuid.uuid4()),
            codigo=codigo.strip(),
            nombre=nombre.strip(),
            descripcion=descripcion.strip(),
            es_sistema=es_sistema,
            activo=activo,
            tipo_alcance=tipo_alcance
        )


@dataclass
class RolPermiso:
    id: str
    rol_id: str
    permiso_codigo: str


@dataclass
class UsuarioRol:
    id: str
    usuario_id: int
    rol_id: str
    proyecto_id: Optional[str] = None
    componente_id: Optional[str] = None
    accion_id: Optional[str] = None
