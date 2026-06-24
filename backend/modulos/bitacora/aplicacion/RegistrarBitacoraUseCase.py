from modulos.bitacora.dominio.BitacoraRepositoryPort import BitacoraRepositoryPort
from modulos.bitacora.dominio.Entidades import Bitacora
from typing import Optional

class RegistrarBitacoraUseCase:
    def __init__(self, repositorio: BitacoraRepositoryPort):
        self.repositorio = repositorio

    def ejecutar(self, descripcion: str, usuario_id: Optional[int] = None) -> Bitacora:
        if not descripcion.strip():
            raise ValueError("La descripción no puede estar vacía.")
        bitacora = Bitacora.crear(descripcion=descripcion, usuario_id=usuario_id)
        return self.repositorio.registrar(bitacora)
