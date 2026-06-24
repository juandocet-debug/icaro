from django.urls import path
from .NotificacionController import NotificacionListCreateController, NotificacionMarkReadController

urlpatterns = [
    path('', NotificacionListCreateController.as_view(), name='notificacion-list-create'),
    path('<str:notificacion_id>/read/', NotificacionMarkReadController.as_view(), name='notificacion-mark-read'),
]
