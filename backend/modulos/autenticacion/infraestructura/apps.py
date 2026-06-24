from django.apps import AppConfig

class AutenticacionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'modulos.autenticacion.infraestructura'
    label = 'autenticacion'

    def ready(self):
        from django.db.models.signals import post_save
        from django.conf import settings
        from .models import ProfileModel

        def crear_perfil_al_crear_usuario(sender, instance, created, **kwargs):
            if created:
                ProfileModel.objects.get_or_create(user=instance)

        post_save.connect(crear_perfil_al_crear_usuario, sender=settings.AUTH_USER_MODEL)
