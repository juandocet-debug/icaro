from modulos.bitacora.dominio.BitacoraRepositoryPort import BitacoraRepositoryPort
from modulos.bitacora.dominio.Entidades import Bitacora
from .models import BitacoraModel
from typing import List

class DjangoBitacoraRepository(BitacoraRepositoryPort):
    def registrar(self, b: Bitacora) -> Bitacora:
        obj = BitacoraModel.objects.create(
            id=b.id,
            usuario_id=b.usuario_id,
            descripcion=b.descripcion
        )
        b.created_at = obj.created_at
        return b

    def listar(self) -> List[Bitacora]:
        objs = BitacoraModel.objects.all()
        return [
            Bitacora(id=o.id, usuario_id=o.usuario_id, descripcion=o.descripcion, created_at=o.created_at)
            for o in objs
        ]

    def listar_por_usuario(self, usuario_id: int) -> List[Bitacora]:
        objs = BitacoraModel.objects.filter(usuario_id=usuario_id)
        return [
            Bitacora(id=o.id, usuario_id=o.usuario_id, descripcion=o.descripcion, created_at=o.created_at)
            for o in objs
        ]

