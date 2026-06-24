from django.urls import path
from .UploadController import UploadListCreateController, UploadDetailController

urlpatterns = [
    path('<str:accion_id>/uploads/', UploadListCreateController.as_view(), name='upload-list-create'),
    path('<str:accion_id>/uploads/<str:upload_id>/', UploadDetailController.as_view(), name='upload-detail'),
]
