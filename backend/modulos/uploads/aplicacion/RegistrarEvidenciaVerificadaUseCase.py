import os
from typing import List, Optional, Dict
from modulos.uploads.dominio.PoliticaArchivoEvidencia import (
    TIPOS_MIME_PERMITIDOS,
    EXTENSIONES_BLOQUEADAS,
    validar_nombre,
    validar_tamano,
)


class RegistrarEvidenciaVerificadaUseCase:
    """
    Valida todas las reglas de dominio para registrar una evidencia verificada.
    No persiste nada, no accede a almacenamiento ni a ORM.
    Devuelve lista de errores o lista vacía si el archivo es aceptable.
    """

    def ejecutar(
        self,
        mime_real: str,
        nombre_archivo: str,
        tamano: int,
        requisito_data: Optional[Dict] = None,
        archivos_existentes: int = 0,
    ) -> List[str]:
        errores: List[str] = []

        errores += validar_nombre(nombre_archivo)
        errores += validar_tamano(tamano)

        ext = os.path.splitext(nombre_archivo)[1].lower()
        if ext in EXTENSIONES_BLOQUEADAS:
            errores.append(f'La extensión {ext} no está permitida.')

        if mime_real not in TIPOS_MIME_PERMITIDOS:
            errores.append(f'Tipo de archivo no permitido: {mime_real}.')

        # Solo validar contra el requisito si no hay errores estructurales previos
        if requisito_data and not errores:
            tipos_req = requisito_data.get('tipos_archivo_permitidos', [])
            if tipos_req and mime_real not in tipos_req:
                errores.append(f'Este requisito no acepta archivos de tipo {mime_real}.')

            max_arch = requisito_data.get('max_archivos')
            if max_arch is not None and archivos_existentes >= max_arch:
                errores.append(
                    f'Este requisito ya tiene el máximo de archivos permitidos ({max_arch}).'
                )

        return errores
