from typing import List, Dict
from modulos.uploads.dominio.PoliticaArchivoEvidencia import TIPOS_MIME_PERMITIDOS, EXTENSIONES_BLOQUEADAS


class ValidarEvidenciasAccionUseCase:
    """
    Valida que un archivo cumple las reglas de un requisito antes de guardarlo.
    No persiste nada — devuelve la lista de errores o lista vacía si es válido.
    """

    def ejecutar(
        self,
        requisito_data: Dict,
        mime_type: str,
        nombre_archivo: str,
        archivos_existentes: int,
    ) -> List[str]:
        errores = []

        # 1. Tipo MIME en whitelist global
        if mime_type not in TIPOS_MIME_PERMITIDOS:
            errores.append(f'Tipo de archivo no permitido: {mime_type}.')

        # 2. Tipo MIME permitido por el requisito
        tipos_req = requisito_data.get('tipos_archivo_permitidos', [])
        if tipos_req and mime_type not in tipos_req:
            errores.append(f'Este requisito no acepta archivos de tipo {mime_type}.')

        # 3. Extensión bloqueada
        nombre_lower = nombre_archivo.lower()
        for ext in EXTENSIONES_BLOQUEADAS:
            if nombre_lower.endswith(ext):
                errores.append(f'La extensión {ext} no está permitida.')
                break

        # 4. Máximo de archivos
        max_arch = requisito_data.get('max_archivos')
        if max_arch is not None and archivos_existentes >= max_arch:
            errores.append(
                f'Este requisito ya tiene el máximo de archivos permitidos ({max_arch}).'
            )

        return errores
