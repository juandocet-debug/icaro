from django.urls import path
from .RolController import RolListCreateController, RolDetailController, PermisosListController

urlpatterns = [
    path('roles/', RolListCreateController.as_view(), name='roles-list-create'),
    path('roles/<str:pk>/', RolDetailController.as_view(), name='roles-detail'),
    path('permisos/', PermisosListController.as_view(), name='permisos-list'),
]
