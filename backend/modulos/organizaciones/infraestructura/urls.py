from django.urls import path
from .OrganizacionController import OrganizacionListCreateController, OrganizacionDetailController

urlpatterns = [
    path('', OrganizacionListCreateController.as_view(), name='organizacion-list-create'),
    path('<str:org_id>/', OrganizacionDetailController.as_view(), name='organizacion-detail'),
]
