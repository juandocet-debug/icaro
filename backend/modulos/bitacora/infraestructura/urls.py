from django.urls import path
from .BitacoraController import BitacoraListCreateController

urlpatterns = [
    path('', BitacoraListCreateController.as_view(), name='bitacora-list-create'),
]
