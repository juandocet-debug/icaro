from modulos.acciones.infraestructura.models import AccionGrupoModel

class ActualizarGrupoAccionUseCase:
    def ejecutar(self, grupo_id: str, nombre: str = None, codigo: str = None, descripcion: str = None, activo: bool = None) -> AccionGrupoModel:
        try:
            grupo = AccionGrupoModel.objects.get(pk=grupo_id)
        except AccionGrupoModel.DoesNotExist:
            raise ValueError("El grupo especificado no existe.")

        if nombre is not None:
            nombre = nombre.strip()
            if not nombre:
                raise ValueError("El nombre del grupo no puede estar vacío.")
            
            # Check unique constraint with other active groups
            if AccionGrupoModel.objects.filter(accion_id=grupo.accion_id, nombre=nombre, activo=True).exclude(pk=grupo_id).exists():
                raise ValueError("Ya existe otro grupo activo con ese nombre para esta acción.")
            grupo.nombre = nombre

        if codigo is not None:
            grupo.codigo = (codigo or "").strip() or None

        if descripcion is not None:
            grupo.descripcion = descripcion or None

        if activo is not None:
            # If changing active state to True, validate uniqueness
            if activo and not grupo.activo:
                if AccionGrupoModel.objects.filter(accion_id=grupo.accion_id, nombre=grupo.nombre, activo=True).exists():
                    raise ValueError("Ya existe un grupo activo con ese nombre para esta acción. No se puede reactivar.")
            grupo.activo = activo

        grupo.save()
        return grupo
