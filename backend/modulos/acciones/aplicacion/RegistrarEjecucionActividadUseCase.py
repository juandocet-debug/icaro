from django.db import transaction
from modulos.acciones.infraestructura.models import AccionModel, AsignacionResponsableAccionModel, HistorialEjecucionAccionModel
from modulos.roles.infraestructura.models import UsuarioRolModel
from django.db.models import F

class RegistrarEjecucionActividadUseCase:
    def ejecutar(self, usuario, accion_id: str, cantidad: float) -> AccionModel:
        if cantidad < 0:
            raise ValueError("La cantidad de ejecución no puede ser negativa.")

        with transaction.atomic():
            try:
                accion = AccionModel.objects.select_for_update().get(pk=accion_id)
            except AccionModel.DoesNotExist:
                raise ValueError("Acción no encontrada.")

            proyecto_id = accion.component.project_id

            # Verificar si el usuario está autorizado a operar sobre la actividad
            es_gestor = False
            if usuario.is_superuser:
                es_gestor = True
            else:
                roles_manager = ['superadministrador', 'administrador_proyecto', 'coordinador_proyecto', 'coordinador_general']
                if UsuarioRolModel.objects.filter(usuario=usuario, proyecto_id=proyecto_id, rol__codigo__in=roles_manager, activo=True).exists():
                    es_gestor = True

            if not es_gestor:
                # Comprobar asignación activa como RESPONSABLE (apoyo no puede registrar ejecución)
                asignacion = AsignacionResponsableAccionModel.objects.filter(
                    accion_id=accion_id,
                    usuario=usuario,
                    activo=True
                ).first()
                if not asignacion:
                    raise PermissionError("No tienes una asignación activa en esta actividad.")
                if asignacion.tipo_asignacion != 'responsable':
                    raise PermissionError("Los colaboradores de apoyo no pueden registrar ejecución; solo los responsables.")

            # Comprobar que no supere la proyección
            proyeccion = float(accion.proyeccion_cuantitativa or 0)
            ejecucion_actual = float(accion.ejecucion_acumulada or 0)
            nueva_ejecucion = ejecucion_actual + float(cantidad)

            if nueva_ejecucion > proyeccion:
                raise ValueError(f"La ejecución acumulada ({nueva_ejecucion}) no puede superar la proyección ({proyeccion}).")

            # Guardar en el historial
            HistorialEjecucionAccionModel.objects.create(
                accion=accion,
                usuario=usuario,
                cantidad=cantidad
            )

            # Actualizar AccionModel.ejecucion_acumulada
            accion.ejecucion_acumulada = nueva_ejecucion
            accion.save(update_fields=['ejecucion_acumulada', 'updated_at'])

            return accion
