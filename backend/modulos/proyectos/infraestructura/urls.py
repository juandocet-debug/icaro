from django.urls import path
from .ProyectoController import ProyectoListCreateController, ProyectoDetailController, ProyectoPortadaController, ProyectoStatsController

urlpatterns = [
    path('', ProyectoListCreateController.as_view(), name='proyecto-list-create'),
    path('<str:proyecto_id>/', ProyectoDetailController.as_view(), name='proyecto-detail'),
    path('<str:proyecto_id>/portada/', ProyectoPortadaController.as_view(), name='proyecto-portada'),
    path('<str:proyecto_id>/stats/', ProyectoStatsController.as_view(), name='proyecto-stats'),
]
