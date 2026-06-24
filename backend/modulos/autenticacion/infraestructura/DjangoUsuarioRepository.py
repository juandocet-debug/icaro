import re
from django.contrib.auth import get_user_model
from django.db import transaction
from modulos.autenticacion.dominio.UsuarioRepositoryPort import UsuarioRepositoryPort
from modulos.autenticacion.infraestructura.models import ProfileModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.roles.infraestructura.models import UsuarioRolModel
from modulos.miembros.infraestructura.models import ProyectoMiembroModel
from modulos.uploads.infraestructura.models import UploadModel

User = get_user_model()

class DjangoUsuarioRepository(UsuarioRepositoryPort):
    def obtener_por_id(self, user_id: int):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
    def actualizar(self, user_id: int, datos: dict):
        with transaction.atomic():
            try:
                user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                raise ValueError("Usuario no encontrado.")

            perfil, _ = ProfileModel.objects.get_or_create(user=user)

            email = datos.get('email')
            if email is not None:
                email = email.lower().strip()
                if not email:
                    raise ValueError("El correo electrónico es obligatorio.")
                if User.objects.exclude(pk=user_id).filter(email__iexact=email).exists():
                    raise ValueError(f'El email "{email}" ya está en uso.')
                user.email = email

            username = datos.get('username')
            if username is not None:
                username = username.strip()
                if not username:
                    raise ValueError("El nombre de usuario es obligatorio.")
                if User.objects.exclude(pk=user_id).filter(username=username).exists():
                    raise ValueError(f'El nombre de usuario "{username}" ya está en uso.')
                user.username = username
                perfil.cedula = username

            first_name = datos.get('first_name')
            if first_name is not None:
                perfil.primer_nombre = first_name.strip()

            last_name = datos.get('last_name')
            if last_name is not None:
                perfil.primer_apellido = last_name.strip()

            # Soportar campos alternativos
            if datos.get('primer_nombre') is not None:
                perfil.primer_nombre = datos.get('primer_nombre').strip()
            if datos.get('segundo_nombre') is not None:
                perfil.segundo_nombre = datos.get('segundo_nombre').strip() or None
            if datos.get('primer_apellido') is not None:
                perfil.primer_apellido = datos.get('primer_apellido').strip()
            if datos.get('segundo_apellido') is not None:
                perfil.segundo_apellido = datos.get('segundo_apellido').strip() or None

            phone = datos.get('phone') or datos.get('telefono')
            if phone is not None:
                phone = str(phone).strip()
                if phone:
                    if not re.match(r'^[+0-9\s-]+$', phone):
                        raise ValueError("El teléfono solo permite números, +, espacios y guiones.")
                    if len(phone) > 20:
                        raise ValueError("El teléfono tiene una longitud máxima de 20 caracteres.")
                perfil.telefono = phone or None

            is_active = datos.get('is_active')
            if is_active is not None:
                user.is_active = bool(is_active)
                if not user.is_active:
                    from modulos.acciones.infraestructura.models import AsignacionResponsableAccionModel
                    AsignacionResponsableAccionModel.objects.filter(usuario=user, activo=True).update(activo=False)

            password = datos.get('password')
            if password is not None:
                pass_str = password.strip()
                if pass_str:
                    if len(pass_str) < 8:
                        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
                    user.set_password(pass_str)

            user.save()
            perfil.save()
            return user

    @transaction.atomic
    def eliminar(self, user_id: int, superadmin_id: int):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValueError("Usuario no encontrado.")

        # Reasignar created_by al superadmin ejecutor
        ProyectoModel.objects.filter(created_by=user).update(created_by_id=superadmin_id)

        # Eliminar en cascada
        UsuarioRolModel.objects.filter(usuario=user).delete()
        ProyectoMiembroModel.objects.filter(usuario=user).delete()

        # Limpiar y borrar archivos físicos de uploads
        uploads = UploadModel.objects.filter(uploaded_by=user)
        for upload in uploads:
            if upload.archivo:
                try:
                    upload.archivo.delete(save=False)
                except Exception as e:
                    print(f"Error al borrar archivo físico de upload: {e}")
        uploads.delete()

        # Eliminar usuario permanentemente
        user.delete()
