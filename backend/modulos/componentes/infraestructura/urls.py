from django.urls import path
from .ComponenteController import ComponenteListCreateController, ComponenteDetailController

urlpatterns = [
    path('<str:proyecto_id>/componentes/', ComponenteListCreateController.as_view(), name='componente-list-create'),
    path('<str:proyecto_id>/componentes/<str:comp_id>/', ComponenteDetailController.as_view(), name='componente-detail'),
]
