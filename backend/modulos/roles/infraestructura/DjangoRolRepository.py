from typing import List, Optional
from django.db import transaction
from ..dominio.RolRepositoryPort import RolRepositoryPort
from ..dominio.Entidades import Rol, Permiso, UsuarioRol
from .models import RolModel, PermisoModel, RolPermisoModel, UsuarioRolModel

class DjangoRolRepository(RolRepositoryPort):
    def _to_rol_entity(self, obj: RolModel) -> Rol:
        permisos_list = list(obj.permisos_rel.values_list('permiso_id', flat=True))
        user_count = UsuarioRolModel.objects.filter(rol=obj).values('usuario_id').distinct().count()
        return Rol(
            id=str(obj.id),
            codigo=obj.codigo,
            nombre=obj.nombre,
            descripcion=obj.descripcion,
            es_sistema=obj.es_sistema,
            activo=obj.activo,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            permisos=permisos_list,
            cantidad_usuarios=user_count,
            tipo_alcance=obj.tipo_alcance
        )

    def obtener_rol_por_id(self, rol_id: str) -> Optional[Rol]:
        try:
            obj = RolModel.objects.prefetch_related('permisos_rel').get(id=rol_id)
            return self._to_rol_entity(obj)
        except (RolModel.DoesNotExist, ValueError):
            return None

    def obtener_rol_por_nombre(self, nombre: str) -> Optional[Rol]:
        try:
            obj = RolModel.objects.prefetch_related('permisos_rel').get(nombre__iexact=nombre.strip())
            return self._to_rol_entity(obj)
        except RolModel.DoesNotExist:
            return None

    def obtener_rol_por_codigo(self, codigo: str) -> Optional[Rol]:
        try:
            obj = RolModel.objects.prefetch_related('permisos_rel').get(codigo=codigo.strip())
            return self._to_rol_entity(obj)
        except RolModel.DoesNotExist:
            return None

    def listar_roles(self) -> List[Rol]:
        qs = RolModel.objects.prefetch_related('permisos_rel').all().order_by('es_sistema', 'nombre')
        return [self._to_rol_entity(o) for o in qs]

    def crear_rol(self, rol: Rol, permisos: List[str]) -> Rol:
        with transaction.atomic():
            obj = RolModel.objects.create(
                id=rol.id,
                codigo=rol.codigo,
                nombre=rol.nombre,
                descripcion=rol.descripcion,
                es_sistema=rol.es_sistema,
                activo=rol.activo,
                tipo_alcance=rol.tipo_alcance
            )
            for p_code in permisos:
                if PermisoModel.objects.filter(codigo=p_code).exists():
                    RolPermisoModel.objects.create(rol=obj, permiso_id=p_code)
            return self._to_rol_entity(obj)

    def actualizar_rol(self, rol: Rol, permisos: List[str]) -> Rol:
        with transaction.atomic():
            obj = RolModel.objects.get(id=rol.id)
            obj.nombre = rol.nombre
            obj.descripcion = rol.descripcion
            obj.activo = rol.activo
            obj.tipo_alcance = rol.tipo_alcance
            obj.save()
            
            # Re-vincular permisos
            RolPermisoModel.objects.filter(rol=obj).delete()
            for p_code in permisos:
                if PermisoModel.objects.filter(codigo=p_code).exists():
                    RolPermisoModel.objects.create(rol=obj, permiso_id=p_code)
            return self._to_rol_entity(obj)

    def eliminar_rol(self, rol_id: str) -> bool:
        with transaction.atomic():
            try:
                obj = RolModel.objects.get(id=rol_id)
                # Si tiene usuarios asignados, no eliminar físicamente, solo desactivar
                if UsuarioRolModel.objects.filter(rol=obj).exists():
                    obj.activo = False
                    obj.save()
                    return True
                else:
                    obj.delete()
                    return True
            except RolModel.DoesNotExist:
                return False

    def listar_permisos(self) -> List[Permiso]:
        qs = PermisoModel.objects.all().order_by('modulo', 'codigo')
        return [Permiso(codigo=o.codigo, nombre=o.nombre, modulo=o.modulo, descripcion=o.descripcion) for o in qs]

    def asignar_rol_usuario(self, usuario_id: int, rol_id: str, proyecto_id: Optional[str] = None, componente_id: Optional[str] = None, accion_id: Optional[str] = None) -> UsuarioRol:
        obj = UsuarioRolModel.objects.create(
            usuario_id=usuario_id,
            rol_id=rol_id,
            proyecto_id=proyecto_id,
            componente_id=componente_id,
            accion_id=accion_id
        )
        return UsuarioRol(
            id=str(obj.id),
            usuario_id=obj.usuario_id,
            rol_id=str(obj.rol_id),
            proyecto_id=str(obj.proyecto_id) if obj.proyecto_id else None,
            componente_id=str(obj.componente_id) if obj.componente_id else None,
            accion_id=str(obj.accion_id) if obj.accion_id else None
        )

    def remover_rol_usuario(self, usuario_id: int, rol_id: str, proyecto_id: Optional[str] = None) -> bool:
        qs = UsuarioRolModel.objects.filter(usuario_id=usuario_id, rol_id=rol_id)
        if proyecto_id:
            qs = qs.filter(proyecto_id=proyecto_id)
        count, _ = qs.delete()
        return count > 0

    def obtener_roles_usuario(self, usuario_id: int) -> List[UsuarioRol]:
        qs = UsuarioRolModel.objects.filter(usuario_id=usuario_id)
        return [
            UsuarioRol(
                id=str(o.id),
                usuario_id=o.usuario_id,
                rol_id=str(o.rol_id),
                proyecto_id=str(o.proyecto_id) if o.proyecto_id else None,
                componente_id=str(o.componente_id) if o.componente_id else None,
                accion_id=str(o.accion_id) if o.accion_id else None
            )
            for o in qs
        ]
