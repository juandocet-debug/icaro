from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .DjangoProfileRepository import DjangoProfileRepository
from modulos.autenticacion.aplicacion.ObtenerPerfilUseCase import ObtenerPerfilUseCase
from modulos.autenticacion.aplicacion.ActualizarPerfilUseCase import ActualizarPerfilUseCase
from .throttling import PasswordChangeRateThrottle
from PIL import Image

ALLOWED_FOTO_TYPES = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}
MAX_FOTO_SIZE = 5 * 1024 * 1024  # 5MB

class MiPerfilController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import ProfileModel
        # Recupera cuentas creadas por versiones anteriores que no generaron
        # ProfileModel. Solo puede reconstruirse el perfil del usuario autenticado.
        defaults = {
            'cedula': request.user.username if request.user.username.isdigit() else None,
            'must_change_password': True,
        }
        perfil, _ = ProfileModel.objects.get_or_create(
            user=request.user,
            defaults=defaults,
        )
        photo_url = None
        if perfil.photo:
            try: photo_url = request.build_absolute_uri(perfil.photo.url)
            except: pass
        return Response({'ok': True, 'datos': {
            'id': str(perfil.id), 'user_id': perfil.user_id,
            'username': request.user.username,
            'email': request.user.email,
            'cedula': perfil.cedula,
            'telefono': perfil.telefono,
            'cargo': perfil.cargo,
            'organizacion_id': str(perfil.organizacion_id) if perfil.organizacion_id else None,
            'must_change_password': perfil.must_change_password,
            'photo_url': photo_url,
        }}, status=200)

    def patch(self, request):
        repo = DjangoProfileRepository()
        try:
            perfil = ActualizarPerfilUseCase(repo).ejecutar(
                user_id=request.user.id,
                telefono=request.data.get('telefono'),
                cargo=request.data.get('cargo'),
                organizacion_id=request.data.get('organizacion_id'))
            return Response({'ok': True, 'datos': {
                'telefono': perfil.telefono, 'cargo': perfil.cargo,
                'organizacion_id': perfil.organizacion_id}}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)


class CambiarClaveController(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PasswordChangeRateThrottle]

    def post(self, request):
        nueva = request.data.get('nueva_clave', '').strip()
        clave_actual = request.data.get('clave_actual', '').strip()

        if not nueva or len(nueva) < 8:
            return Response({'ok': False, 'error': 'La contraseña debe tener al menos 8 caracteres.'}, status=400)

        from .models import ProfileModel
        perfil = ProfileModel.objects.filter(user=request.user).first()
        if not perfil:
            return Response({'ok': False, 'error': 'Perfil no encontrado.'}, status=404)

        if perfil.must_change_password:
            # Primer ingreso: no exige clave_actual
            # Pero de todas formas no debe ser igual a la actual (cédula)
            if request.user.check_password(nueva):
                return Response({'ok': False, 'error': 'La nueva contraseña no puede ser igual a la actual.'}, status=400)
        else:
            # Ingreso normal: exige clave_actual y validación
            if not clave_actual:
                return Response({'ok': False, 'error': 'La contraseña actual es requerida.'}, status=400)
            if not request.user.check_password(clave_actual):
                return Response({'ok': False, 'error': 'La contraseña actual es incorrecta.'}, status=400)
            if clave_actual == nueva or request.user.check_password(nueva):
                return Response({'ok': False, 'error': 'La nueva contraseña no puede ser igual a la actual.'}, status=400)

        request.user.set_password(nueva)
        request.user.save()

        perfil.must_change_password = False
        perfil.save(update_fields=['must_change_password'])

        # set_password() invalida el JWT anterior porque cambia el hash de la contraseña.
        # Generamos tokens nuevos para que el cliente no pierda la sesión.
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(request.user)
        return Response({
            'ok': True,
            'mensaje': 'Contraseña actualizada correctamente.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=200)


class FotoPerfilController(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        archivo = request.FILES.get('foto')
        if not archivo:
            return Response({'ok': False, 'error': 'No se envió ningún archivo.'}, status=400)
        if archivo.content_type not in ALLOWED_FOTO_TYPES:
            return Response({'ok': False, 'error': 'Tipo no permitido. Use jpg, png o webp.'}, status=400)
        if archivo.size > MAX_FOTO_SIZE:
            return Response({'ok': False, 'error': 'El archivo supera 5MB.'}, status=400)

        # Validar con Pillow como imagen real
        try:
            # 1. verificar integridad
            img = Image.open(archivo)
            img.verify()
            
            # 2. reabrir para revisar dimensiones (ancho/alto)
            archivo.seek(0)
            img = Image.open(archivo)
            width, height = img.size
            if width > 4096 or height > 4096:
                return Response({'ok': False, 'error': 'La imagen no debe superar los 4096x4096 píxeles.'}, status=400)
        except Exception:
            return Response({'ok': False, 'error': 'Archivo de imagen inválido o corrupto.'}, status=400)

        from .models import ProfileModel
        perfil = ProfileModel.objects.filter(user=request.user).first()
        if not perfil:
            return Response({'ok': False, 'error': 'Perfil no encontrado.'}, status=404)

        # Guardar la nueva foto antes de borrar la anterior
        foto_anterior = perfil.photo
        archivo.seek(0)
        perfil.photo = archivo
        perfil.save(update_fields=['photo'])

        # Si el guardado fue exitoso, borrar la anterior
        if foto_anterior and foto_anterior != perfil.photo:
            try: foto_anterior.delete(save=False)
            except: pass

        photo_url = request.build_absolute_uri(perfil.photo.url) if perfil.photo else None
        return Response({'ok': True, 'photo_url': photo_url}, status=200)


from modulos.autenticacion.aplicacion.ObtenerMiAccesoUseCase import ObtenerMiAccesoUseCase

class MiAccesoController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.core.cache import cache
        cache_key = f'mi_acceso_{request.user.id}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({'ok': True, 'datos': cached}, status=200)

        use_case = ObtenerMiAccesoUseCase()
        try:
            datos = use_case.ejecutar(request.user.id)
            cache.set(cache_key, datos, timeout=120)  # 2 minutos
            return Response({'ok': True, 'datos': datos}, status=200)
        except ValueError as e:
            return Response({'ok': False, 'error': str(e)}, status=400)
