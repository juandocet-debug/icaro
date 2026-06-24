from django.urls import path
from .TipoDocumentoController import TipoDocumentoListCreateController, TipoDocumentoDetailController

urlpatterns = [
    path('<str:proyecto_id>/tipos-documento/',
         TipoDocumentoListCreateController.as_view(),
         name='tipo-documento-list-create'),
    path('<str:proyecto_id>/tipos-documento/<str:tipo_id>/',
         TipoDocumentoDetailController.as_view(),
         name='tipo-documento-detail'),
]
