import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Nit:
    """
    Value Object que representa un NIT colombiano.
    Valida que tenga entre 8 y 15 dígitos (con o sin dígito de verificación).
    """
    value: str

    def __post_init__(self):
        limpio = self.value.replace('-', '').replace('.', '').strip()
        if not re.match(r'^\d{8,15}$', limpio):
            raise ValueError(
                f"NIT inválido: '{self.value}'. Debe contener entre 8 y 15 dígitos."
            )
