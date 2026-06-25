import re
import secrets
import string
from django.contrib.auth import get_user_model
from modulos.autenticacion.infraestructura.models import ProfileModel

User = get_user_model()

_PASSWORD_ALPHABET = string.ascii_letters + string.digits

def _generar_password_temporal() -> str:
    """Genera contraseña aleatoria segura de 12 caracteres (letras + dígitos).
    Usa secrets.choice para máxima entropía criptográfica.
    """
    return ''.join(secrets.choice(_PASSWORD_ALPHABET) for _ in range(12))


class CrearUsuarioUseCase:
    def ejecutar(self, cedula: str, primer_nombre: str, segundo_nombre: str, primer_apellido: str, segundo_apellido: str, email: str, telefono: str):
        # 1. Validar cédula
        cedula = str(cedula).strip()
        if not cedula.isdigit():
            raise ValueError("La cédula solo debe contener números.")
        if len(cedula) < 6 or len(cedula) > 20:
            raise ValueError("La cédula debe tener entre 6 y 20 caracteres.")

        # 2. Validar teléfono (opcional)
        telefono = str(telefono).strip() if telefono else ''
        if telefono:
            if not re.match(r'^[+0-9\s-]+$', telefono):
                raise ValueError("El teléfono solo permite números, +, espacios y guiones.")
            if len(telefono) > 20:
                raise ValueError("El teléfono tiene una longitud máxima de 20 caracteres.")

        # 3. Validar email obligatorio y único
        if not email:
            raise ValueError("El correo electrónico es obligatorio.")
        email = email.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise ValueError(f'El email "{email}" ya está en uso.')

        # 4. Validar cédula única
        if User.objects.filter(username=cedula).exists():
            raise ValueError(f'Ya existe un usuario con la cédula "{cedula}".')

        # 5. Crear usuario y perfil de forma atómica
        from django.db import transaction

        # SECURITY: contraseña aleatoria segura — nunca la cédula.
        # Se retorna en texto plano UNA VEZ para que el admin se la entregue al usuario.
        # En la BD siempre queda como hash PBKDF2.
        password_temporal = _generar_password_temporal()

        with transaction.atomic():
            user = User.objects.create_user(
                username=cedula,
                email=email,
                password=password_temporal,
                is_staff=False
            )

            perfil, _ = ProfileModel.objects.get_or_create(user=user)
            perfil.cedula = cedula
            perfil.telefono = telefono or None
            perfil.primer_nombre = primer_nombre.strip()
            perfil.segundo_nombre = segundo_nombre.strip() if segundo_nombre else None
            perfil.primer_apellido = primer_apellido.strip()
            perfil.segundo_apellido = segundo_apellido.strip() if segundo_apellido else None
            perfil.must_change_password = True
            perfil.save()

        # Retornar el usuario Y la contraseña temporal para que el controller
        # la incluya en la respuesta (se muestra una sola vez al admin).
        return user, password_temporal

