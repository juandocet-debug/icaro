from dataclasses import dataclass

@dataclass(frozen=True)
class TipoArchivo:
    """Valida que el tipo MIME sea aceptado por el sistema."""
    TIPOS_PERMITIDOS = ('image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'application/zip')
    value: str
    def __post_init__(self):
        if self.value and self.value not in self.TIPOS_PERMITIDOS:
            raise ValueError(f"Tipo de archivo no permitido: '{self.value}'. Tipos válidos: {self.TIPOS_PERMITIDOS}")
