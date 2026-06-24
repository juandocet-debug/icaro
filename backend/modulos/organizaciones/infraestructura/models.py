from django.db import models
import uuid


class OrganizacionModel(models.Model):
    """
    Modelo de infraestructura para persistencia de Organización.
    Representa la organización ejecutora (CORPOACIIC y futuras).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    sigla = models.CharField(max_length=50, blank=True, null=True)
    nit = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'organizaciones'
        db_table = 'organizaciones'
        verbose_name = 'Organización'
        verbose_name_plural = 'Organizaciones'

    def __str__(self):
        return f"{self.nombre} ({self.sigla})" if self.sigla else self.nombre
