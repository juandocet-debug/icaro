from django.urls import path
from .MetaController import MetaListCreateController, MetaDetailController, MetaArchivarController

urlpatterns = [
    path('<str:proyecto_id>/metas/', MetaListCreateController.as_view(), name='meta-list-create'),
    path('<str:proyecto_id>/metas/<str:meta_id>/', MetaDetailController.as_view(), name='meta-detail'),
    path('<str:proyecto_id>/metas/<str:meta_id>/archivar/', MetaArchivarController.as_view(), name='meta-archivar'),
]
