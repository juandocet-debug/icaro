from dataclasses import dataclass

@dataclass(frozen=True)
class EstadoProyecto:
    ESTADOS_VALIDOS = ('activo', 'inactivo', 'completado', 'suspendido')
    value: str
    def __post_init__(self):
        if self.value not in self.ESTADOS_VALIDOS:
            raise ValueError(f"Estado inválido: '{self.value}'. Válidos: {self.ESTADOS_VALIDOS}")
