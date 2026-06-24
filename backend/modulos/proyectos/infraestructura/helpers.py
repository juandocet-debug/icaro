from django.core.exceptions import ObjectDoesNotExist, ValidationError
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel
from modulos.uploads.infraestructura.models import UploadModel
from modulos.roles.aplicacion.VerificarPermisoUseCase import VerificarPermisoUseCase

def check_project_access(proyecto_id, user):
    try:
        proyecto = ProyectoModel.objects.get(id=proyecto_id)
    except (ObjectDoesNotExist, ValueError, ValidationError):
        raise ValueError("Proyecto no encontrado.")
        
    # Verificar permiso proyectos.ver
    try:
        VerificarPermisoUseCase().ejecutar(user.id, 'proyectos.ver', proyecto_id=proyecto_id)
    except PermissionError as e:
        raise PermissionError(str(e))
        
    return proyecto

def check_component_access(comp_id, proyecto_id, user):
    check_project_access(proyecto_id, user)
    
    try:
        componente = ComponenteModel.objects.get(id=comp_id)
    except (ObjectDoesNotExist, ValueError, ValidationError):
        raise ValueError("Componente no encontrado.")
        
    if str(componente.project_id) != str(proyecto_id):
        raise PermissionError("El componente no pertenece al proyecto especificado.")
        
    try:
        VerificarPermisoUseCase().ejecutar(user.id, 'componentes.ver', proyecto_id=proyecto_id, componente_id=comp_id)
    except PermissionError as e:
        raise PermissionError(str(e))
        
    return componente

def check_component_only_access(comp_id, user):
    try:
        comp = ComponenteModel.objects.get(id=comp_id)
    except (ObjectDoesNotExist, ValueError, ValidationError):
        raise ValueError("Componente no encontrado.")
    check_project_access(comp.project_id, user)
    
    try:
        VerificarPermisoUseCase().ejecutar(user.id, 'componentes.ver', proyecto_id=comp.project_id, componente_id=comp_id)
    except PermissionError as e:
        raise PermissionError(str(e))
        
    return comp

def check_action_access(accion_id, comp_id, user):
    try:
        accion = AccionModel.objects.get(id=accion_id)
    except (ObjectDoesNotExist, ValueError, ValidationError):
        raise ValueError("Accion no encontrada.")
        
    if str(accion.component_id) != str(comp_id):
        raise PermissionError("La accion no pertenece al componente especificado.")
        
    comp = check_component_only_access(comp_id, user)
    
    try:
        VerificarPermisoUseCase().ejecutar(user.id, 'acciones.ver', proyecto_id=comp.project_id, componente_id=comp_id, accion_id=accion_id)
    except PermissionError as e:
        raise PermissionError(str(e))
        
    return accion

def check_action_only_access(accion_id, user):
    try:
        accion = AccionModel.objects.get(id=accion_id)
    except (ObjectDoesNotExist, ValueError, ValidationError):
        raise ValueError("Accion no encontrada.")
    comp = check_component_only_access(accion.component_id, user)
    
    try:
        VerificarPermisoUseCase().ejecutar(user.id, 'acciones.ver', proyecto_id=comp.project_id, componente_id=comp.id, accion_id=accion_id)
    except PermissionError as e:
        raise PermissionError(str(e))
        
    return accion

def check_upload_access(upload_id, accion_id, user):
    try:
        upload = UploadModel.objects.get(id=upload_id)
    except (ObjectDoesNotExist, ValueError, ValidationError):
        raise ValueError("Upload no encontrado.")
        
    if str(upload.action_id) != str(accion_id):
        raise PermissionError("El upload no pertenece a la accion especificada.")
        
    check_action_only_access(accion_id, user)
    return upload
