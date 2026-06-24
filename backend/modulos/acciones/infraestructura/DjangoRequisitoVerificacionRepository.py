from typing import List
from django.db import transaction
from modulos.acciones.dominio.RequisitoVerificacion import RequisitoVerificacion
from modulos.acciones.dominio.RequisitoVerificacionRepositoryPort import RequisitoVerificacionRepositoryPort
from .models import RequisitoVerificacionAccionModel


def _to_entity(obj: RequisitoVerificacionAccionModel) -> RequisitoVerificacion:
    return RequisitoVerificacion(
        id=str(obj.id),
        accion_id=str(obj.accion_id),
        nombre=obj.nombre,
        descripcion=obj.descripcion,
        obligatorio=obj.obligatorio,
        tipos_archivo_permitidos=obj.tipos_archivo_permitidos or [],
        min_archivos=obj.min_archivos,
        max_archivos=obj.max_archivos,
        orden=obj.orden,
        activo=obj.activo,
    )


class DjangoRequisitoVerificacionRepository(RequisitoVerificacionRepositoryPort):

    def crear(self, req: RequisitoVerificacion) -> RequisitoVerificacion:
        obj = RequisitoVerificacionAccionModel.objects.create(
            id=req.id,
            accion_id=req.accion_id,
            nombre=req.nombre,
            descripcion=req.descripcion,
            obligatorio=req.obligatorio,
            tipos_archivo_permitidos=req.tipos_archivo_permitidos,
            min_archivos=req.min_archivos,
            max_archivos=req.max_archivos,
            orden=req.orden,
            activo=req.activo,
        )
        return _to_entity(obj)

    def listar_por_accion(self, accion_id: str) -> List[RequisitoVerificacion]:
        qs = RequisitoVerificacionAccionModel.objects.filter(
            accion_id=accion_id, activo=True
        ).order_by('orden', 'created_at')
        return [_to_entity(o) for o in qs]

    @transaction.atomic
    def reemplazar_todos(self, accion_id: str, requisitos: List[RequisitoVerificacion]) -> List[RequisitoVerificacion]:
        RequisitoVerificacionAccionModel.objects.filter(accion_id=accion_id).delete()
        result = []
        for req in requisitos:
            req.accion_id = accion_id
            result.append(self.crear(req))
        return result
