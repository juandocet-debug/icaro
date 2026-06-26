from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Optional
import uuid


@dataclass
class Accion:
    id: str
    componente_id: str
    name: str
    description: Optional[str] = None
    action_type: Optional[str] = None
    total_sessions: int = 1
    proyeccion_cuantitativa: Optional[Decimal] = None
    unidad_medida: Optional[str] = None
    ejecucion_acumulada: Decimal = Decimal('0')
    is_transversal: bool = False
    display_order: int = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    requiere_grupos: bool = False

    @classmethod
    def crear(cls, componente_id: str, name: str, **kwargs) -> 'Accion':
        if not name or not name.strip():
            raise ValueError('El nombre de la accion es obligatorio.')
        proyeccion = kwargs.get('proyeccion_cuantitativa')
        ejecucion = kwargs.get('ejecucion_acumulada', Decimal('0'))
        if proyeccion is not None and Decimal(str(proyeccion)) < 0:
            raise ValueError('La proyeccion no puede ser negativa.')
        if Decimal(str(ejecucion)) < 0:
            raise ValueError('La ejecucion no puede ser negativa.')
        if proyeccion is not None and Decimal(str(ejecucion)) > Decimal(str(proyeccion)):
            raise ValueError('La ejecucion no puede superar la proyeccion.')
        return cls(id=str(uuid.uuid4()), componente_id=componente_id, name=name.strip(), **kwargs)
