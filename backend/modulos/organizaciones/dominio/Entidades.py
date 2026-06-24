import uuid
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Organizacion:
    """
    Entidad de dominio que representa una organización ejecutora.
    Aunque inicialmente existe una sola (CORPOACIIC), el modelo
    soporta arquitecturas multi-tenant futuras.
    """
    id: str
    nombre: str
    sigla: Optional[str]
    nit: Optional[str]
    activo: bool

    @classmethod
    def registrar(cls, nombre: str, sigla: Optional[str] = None, nit: Optional[str] = None) -> 'Organizacion':
        """Crea una nueva organización activa."""
        return cls(
            id=str(uuid.uuid4()),
            nombre=nombre,
            sigla=sigla,
            nit=nit,
            activo=True,
        )

    def desactivar(self):
        """Marca la organización como inactiva."""
        self.activo = False

    def __str__(self):
        return f"{self.nombre} ({self.sigla})" if self.sigla else self.nombre
