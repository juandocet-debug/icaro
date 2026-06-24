from django.urls import path
from .MisActividadesController import MisActividadesController, MisActividadesEjecucionController, MisActividadesEvidenciasController
from .EvidenciasOperativasController import (
    EvidenciasOperativasListCreateController,
    EvidenciasOperativasDetailController,
    EvidenciasOperativasSoportesController,
    EvidenciasOperativasUploadParamsController,
    EvidenciasOperativasEnviarController,
    EvidenciasOperativasRevisarController,
    EvidenciasOperativasReabrirController,
)

urlpatterns = [
    path('', MisActividadesController.as_view(), name='mis-actividades-list'),
    path('<str:accion_id>/', MisActividadesController.as_view(), name='mis-actividades-detail'),
    path('<str:accion_id>/ejecucion/', MisActividadesEjecucionController.as_view(), name='mis-actividades-ejecucion'),
    path('<str:accion_id>/evidencias/', MisActividadesEvidenciasController.as_view(), name='mis-actividades-evidencias'),

    # Evidencias operativas (modelo con estados y soportes múltiples)
    path('<str:accion_id>/evidencias-operativas/', EvidenciasOperativasListCreateController.as_view(), name='evidencias-operativas-list'),
    path('<str:accion_id>/evidencias-operativas/<str:ev_id>/', EvidenciasOperativasDetailController.as_view(), name='evidencias-operativas-detail'),
    path('<str:accion_id>/evidencias-operativas/<str:ev_id>/upload-params/', EvidenciasOperativasUploadParamsController.as_view(), name='evidencias-operativas-upload-params'),
    path('<str:accion_id>/evidencias-operativas/<str:ev_id>/soportes/', EvidenciasOperativasSoportesController.as_view(), name='evidencias-operativas-soportes'),
    path('<str:accion_id>/evidencias-operativas/<str:ev_id>/soportes/<str:soporte_id>/', EvidenciasOperativasSoportesController.as_view(), name='evidencias-operativas-soporte-delete'),
    path('<str:accion_id>/evidencias-operativas/<str:ev_id>/enviar/', EvidenciasOperativasEnviarController.as_view(), name='evidencias-operativas-enviar'),
    path('<str:accion_id>/evidencias-operativas/<str:ev_id>/revisar/', EvidenciasOperativasRevisarController.as_view(), name='evidencias-operativas-revisar'),
    path('<str:accion_id>/evidencias-operativas/<str:ev_id>/reabrir/', EvidenciasOperativasReabrirController.as_view(), name='evidencias-operativas-reabrir'),
]
