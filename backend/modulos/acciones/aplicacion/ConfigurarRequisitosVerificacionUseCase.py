from typing import List, Dict, Any
from modulos.acciones.dominio.RequisitoVerificacion import RequisitoVerificacion
from modulos.acciones.dominio.RequisitoVerificacionRepositoryPort import RequisitoVerificacionRepositoryPort


class ConfigurarRequisitosVerificacionUseCase:
    def __init__(self, repo: RequisitoVerificacionRepositoryPort):
        self.repo = repo

    def ejecutar(self, accion_id: str, datos_requisitos: List[Dict[str, Any]]) -> List[RequisitoVerificacion]:
        """
        Reemplaza de forma atómica todos los requisitos de una acción.
        Valida que no haya nombres duplicados en la misma operación.
        """
        nombres = [d.get('nombre', '').strip() for d in datos_requisitos]
        if len(nombres) != len(set(nombres)):
            raise ValueError('No pueden existir dos requisitos con el mismo nombre en la misma acción.')

        requisitos = []
        for i, d in enumerate(datos_requisitos):
            req = RequisitoVerificacion.crear(
                accion_id=accion_id,
                nombre=d.get('nombre', ''),
                tipos_archivo_permitidos=d.get('tipos_archivo_permitidos', []),
                min_archivos=d.get('min_archivos', 1),
                max_archivos=d.get('max_archivos'),
                obligatorio=d.get('obligatorio', True),
                descripcion=d.get('descripcion'),
                orden=d.get('orden', i),
            )
            requisitos.append(req)

        return self.repo.reemplazar_todos(accion_id, requisitos)
