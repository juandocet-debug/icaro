import re
from django.contrib.auth import get_user_model
from modulos.autenticacion.infraestructura.models import ProfileModel

User = get_user_model()

class ActualizarDatosUsuarioUseCase:
    def ejecutar(self, user_id: int, primer_nombre: str = None, segundo_nombre: str = None,
                 primer_apellido: str = None, segundo_apellido: str = None,
                 email: str = None, telefono: str = None, is_active: bool = None, password: str = None):
        
        from django.db import transaction
        with transaction.atomic():
            try:
                user = User.objects.select_related('profile').get(pk=user_id)
            except User.DoesNotExist:
                raise ValueError("Usuario no encontrado.")

            perfil = getattr(user, 'profile', None)
            if not perfil:
                perfil = ProfileModel.objects.create(user=user)

            # Validar y actualizar email
            if email is not None:
                email = email.lower().strip()
                if not email:
                    raise ValueError("El correo electrónico es obligatorio.")
                if User.objects.exclude(pk=user_id).filter(email__iexact=email).exists():
                    raise ValueError(f'El email "{email}" ya está en uso.')
                user.email = email

            # Validar y actualizar teléfono
            if telefono is not None:
                telefono = str(telefono).strip()
                if not re.match(r'^[+0-9\s-]+$', telefono):
                    raise ValueError("El teléfono solo permite números, +, espacios y guiones.")
                if len(telefono) > 20:
                    raise ValueError("El teléfono tiene una longitud máxima de 20 caracteres.")
                perfil.telefono = telefono

            # Actualizar nombres
            if primer_nombre is not None:
                perfil.primer_nombre = primer_nombre.strip()
            if segundo_nombre is not None:
                perfil.segundo_nombre = segundo_nombre.strip() if segundo_nombre.strip() else None
            if primer_apellido is not None:
                perfil.primer_apellido = primer_apellido.strip()
            if segundo_apellido is not None:
                perfil.segundo_apellido = segundo_apellido.strip() if segundo_apellido.strip() else None

            # Actualizar estado activo
            if is_active is not None:
                user.is_active = is_active

            # Actualizar contraseña
            if password is not None:
                pass_str = password.strip()
                if pass_str:
                    if len(pass_str) < 8:
                        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
                    user.set_password(pass_str)

            user.save()
            perfil.save()

        return user
