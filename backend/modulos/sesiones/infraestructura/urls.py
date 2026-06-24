from django.urls import path
from .SesionController import SesionListCreateController

urlpatterns = [
    path('', SesionListCreateController.as_view(), name='sesion-list-create'),
]
