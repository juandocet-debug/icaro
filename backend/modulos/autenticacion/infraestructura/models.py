from django.db import models
from django.conf import settings
import uuid

class ProfileModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    telefono             = models.CharField(max_length=20, null=True, blank=True)
    cargo                = models.CharField(max_length=100, null=True, blank=True)
    organizacion         = models.ForeignKey('organizaciones.OrganizacionModel', on_delete=models.SET_NULL, null=True, blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)
    cedula               = models.CharField(max_length=20, unique=True, null=True, blank=True)
    photo                = models.ImageField(upload_to='perfiles/fotos/', null=True, blank=True)
    must_change_password = models.BooleanField(default=False)

    primer_nombre        = models.CharField(max_length=80, default="")
    segundo_nombre       = models.CharField(max_length=80, null=True, blank=True)
    primer_apellido      = models.CharField(max_length=80, default="")
    segundo_apellido     = models.CharField(max_length=80, null=True, blank=True)

    class Meta:
        app_label = 'autenticacion'
        db_table = 'user_profiles'
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuario'

    def clean(self):
        import re
        if self.telefono:
            self.telefono = self.telefono.strip()
            if not re.match(r'^[+0-9\s-]+$', self.telefono):
                raise ValueError("El teléfono solo permite números, +, espacios y guiones.")
            if len(self.telefono) > 20:
                raise ValueError("El teléfono tiene una longitud máxima de 20 caracteres.")
        if self.cedula:
            self.cedula = self.cedula.strip()
            if not self.cedula.isdigit():
                raise ValueError("La cédula solo debe contener números.")
            if len(self.cedula) < 6 or len(self.cedula) > 20:
                raise ValueError("La cédula debe tener entre 6 y 20 caracteres.")

    def save(self, *args, **kwargs):
        self.clean()
        # Normalizar nombres y apellidos
        self.primer_nombre = self.primer_nombre.strip()
        if self.segundo_nombre:
            self.segundo_nombre = self.segundo_nombre.strip()
        self.primer_apellido = self.primer_apellido.strip()
        if self.segundo_apellido:
            self.segundo_apellido = self.segundo_apellido.strip()
            
        # Sincronizar first_name y last_name en User
        user = self.user
        nombres = [self.primer_nombre]
        if self.segundo_nombre:
            nombres.append(self.segundo_nombre)
        user.first_name = " ".join(nombres)[:150]
        
        apellidos = [self.primer_apellido]
        if self.segundo_apellido:
            apellidos.append(self.segundo_apellido)
        user.last_name = " ".join(apellidos)[:150]
        
        # Sincronizar username con cédula
        if self.cedula:
            user.username = self.cedula
            
        # Normalizar email a minúsculas
        if user.email:
            user.email = user.email.lower().strip()
            
        user.save(update_fields=['first_name', 'last_name', 'username', 'email'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Perfil de {self.user.username}'
