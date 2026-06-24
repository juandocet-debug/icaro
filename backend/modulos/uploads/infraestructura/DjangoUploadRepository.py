from typing import Optional, List
from modulos.uploads.dominio.UploadRepositoryPort import UploadRepositoryPort
from modulos.uploads.dominio.Entidades import Upload
from .models import UploadModel

class DjangoUploadRepository(UploadRepositoryPort):
    def _to_entity(self, obj) -> Upload:
        return Upload(id=str(obj.id), accion_id=str(obj.action_id), uploaded_by_id=obj.uploaded_by_id,
                      file_url=obj.file_url, file_name=obj.file_name, file_type=obj.file_type,
                      file_size=obj.file_size, status=obj.status, verified_by_id=obj.verified_by_id,
                      rejection_reason=obj.rejection_reason, receipt_number=obj.receipt_number)
    def registrar(self, u: Upload) -> Upload:
        obj = UploadModel.objects.create(id=u.id, action_id=u.accion_id, uploaded_by_id=u.uploaded_by_id,
            file_url=u.file_url, file_name=u.file_name, file_type=u.file_type,
            file_size=u.file_size, status=u.status, receipt_number=u.receipt_number)
        return self._to_entity(obj)
    def obtener_por_id(self, id: str) -> Optional[Upload]:
        try: return self._to_entity(UploadModel.objects.get(id=id))
        except UploadModel.DoesNotExist: return None
    def listar_por_accion(self, accion_id: str) -> List[Upload]:
        return [self._to_entity(o) for o in UploadModel.objects.filter(action_id=accion_id)]
    def eliminar(self, id: str) -> bool:
        deleted, _ = UploadModel.objects.filter(id=id).delete()
        return deleted > 0
