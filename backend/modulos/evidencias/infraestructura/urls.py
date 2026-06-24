from django.urls import path
from .EvidenciaController import EvidenciaListCreateController
from .EvidenciasOperativasGeneralController import EvidenciasOperativasGeneralController

urlpatterns = [
    path('proyecto/<str:proyecto_id>/', EvidenciaListCreateController.as_view(), name='evidencia-list-create'),
    path('proyecto/<str:proyecto_id>/evidencias-operativas-general/', EvidenciasOperativasGeneralController.as_view(), name='evidencias-operativas-general'),
    path('proyecto/<str:proyecto_id>/evidencias-operativas-general/<str:ev_id>/', EvidenciasOperativasGeneralController.as_view(), name='evidencias-operativas-general-detail'),
]
