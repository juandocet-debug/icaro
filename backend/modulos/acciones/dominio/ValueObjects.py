from dataclasses import dataclass

@dataclass(frozen=True)
class EstadoAccion:
    ESTADOS_VALIDOS = ('programada', 'en_ejecucion', 'completada', 'cancelada')
    value: str
    def __post_init__(self):
        if self.value not in self.ESTADOS_VALIDOS:
            raise ValueError(f"Estado de acción inválido: '{self.value}'. Válidos: {self.ESTADOS_VALIDOS}")
