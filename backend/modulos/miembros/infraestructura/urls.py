from django.urls import path
from .ProyectoMiembroController import (
    ProyectoMiembroListCreateController,
    ProyectoMiembroDetailController,
    ProyectoMiembroRolDetailController,
)

urlpatterns = [
    path('<str:proyecto_id>/miembros/',
         ProyectoMiembroListCreateController.as_view(),
         name='proyecto-miembro-list-create'),
    path('<str:proyecto_id>/miembros/<str:miembro_id>/',
         ProyectoMiembroDetailController.as_view(),
         name='proyecto-miembro-detail'),
    path('<str:proyecto_id>/miembros/roles/<str:asignacion_id>/',
         ProyectoMiembroRolDetailController.as_view(),
         name='proyecto-miembro-rol-detail'),
]
