
import pytest
from modulos.organizaciones.infraestructura.models import OrganizacionModel
from modulos.proyectos.infraestructura.models import ProyectoModel
from modulos.componentes.infraestructura.models import ComponenteModel
from modulos.acciones.infraestructura.models import AccionModel
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_organizacion_creation():
    org = OrganizacionModel.objects.create(nombre='CORPOACIIC', sigla='CORPO')
    assert org.nombre == 'CORPOACIIC'

@pytest.mark.django_db
def test_project_component_action_hierarchy():
    from modulos.metas.infraestructura.models import MetaModel
    user = User.objects.create(username='testuser')
    proyecto = ProyectoModel.objects.create(name='Proyecto X', created_by=user)
    meta = MetaModel.objects.create(
        proyecto=proyecto,
        nombre="Default Meta",
        activo=True,
        created_by=user
    )
    componente = ComponenteModel.objects.create(project=proyecto, meta=meta, name='Componente 1')
    accion = AccionModel.objects.create(component=componente, name='Accion 1')
    
    assert componente.project == proyecto
    assert accion.component == componente

