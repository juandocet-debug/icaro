from django.db import models
from django.core.exceptions import ValidationError, ObjectDoesNotExist
import uuid

class ComponenteModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('proyectos.ProyectoModel', on_delete=models.CASCADE, related_name='componentes')
    meta = models.ForeignKey('metas.MetaModel', on_delete=models.CASCADE, related_name='componentes')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'componentes'
        db_table = 'components'
        ordering = ['display_order', 'created_at']

    def clean(self):
        super().clean()
        if not getattr(self, 'meta_id', None):
            raise ValidationError({"meta": "La meta es obligatoria para el componente."})
        try:
            meta = self.meta
        except ObjectDoesNotExist:
            raise ValidationError({"meta": "La meta especificada no existe."})
            
        if getattr(self, 'project_id', None) and str(meta.proyecto_id) != str(self.project_id):
            raise ValidationError({"meta": "La meta seleccionada pertenece a otro proyecto."})
            
        if not meta.activo:
            raise ValidationError({"meta": "La meta seleccionada está archivada."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
