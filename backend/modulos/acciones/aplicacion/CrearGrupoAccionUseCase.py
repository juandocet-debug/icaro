import uuid
from modulos.acciones.infraestructura.models import AccionGrupoModel, AccionModel

class CrearGrupoAccionUseCase:
    def ejecutar(self, accion_id: str, nombre: str, codigo: str = None, descripcion: str = None) -> AccionGrupoModel:
        nombre = (nombre or "").strip()
        if not nombre:
            raise ValueError("El nombre del grupo es obligatorio.")
        
        try:
            accion = AccionModel.objects.get(pk=accion_id)
        except AccionModel.DoesNotExist:
            raise ValueError("La acción especificada no existe.")

        if AccionGrupoModel.objects.filter(accion_id=accion_id, nombre=nombre, activo=True).exists():
            raise ValueError("Ya existe un grupo activo con ese nombre para esta acción.")

        grupo = AccionGrupoModel.objects.create(
            id=uuid.uuid4(),
            accion=accion,
            nombre=nombre,
            codigo=(codigo or "").strip() or None,
            descripcion=descripcion or None,
            activo=True
        )
        return grupo
