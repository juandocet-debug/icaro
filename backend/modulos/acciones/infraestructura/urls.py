from django.urls import path
from .AccionController import AccionListCreateController, AccionDetailController, AccionRequisitosController
from .ActividadResponsablesController import ActividadResponsablesController
from .AccionGrupoController import AccionGrupoListCreateController, AccionGrupoDetailController

urlpatterns = [
    path('<str:comp_id>/acciones/', AccionListCreateController.as_view(), name='accion-list-create'),
    path('<str:comp_id>/acciones/<str:accion_id>/', AccionDetailController.as_view(), name='accion-detail'),
    path('<str:comp_id>/acciones/<str:accion_id>/requisitos/', AccionRequisitosController.as_view(), name='accion-requisitos'),
    path('<str:comp_id>/acciones/<str:accion_id>/responsables/', ActividadResponsablesController.as_view(), name='actividad-responsables'),
    path('<str:comp_id>/acciones/<str:accion_id>/responsables/<str:asignacion_id>/', ActividadResponsablesController.as_view(), name='actividad-responsable-retirar'),
    
    path('<str:accion_id>/grupos/', AccionGrupoListCreateController.as_view(), name='accion-grupo-list-create'),
    path('<str:accion_id>/grupos/<str:grupo_id>/', AccionGrupoDetailController.as_view(), name='accion-grupo-detail'),
]

