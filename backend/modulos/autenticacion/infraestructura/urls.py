from django.urls import path
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .PerfilController import MiPerfilController, CambiarClaveController, FotoPerfilController, MiAccesoController
from .UsuariosListController import UsuariosListController, UsuarioDetailController, UsuarioAsignacionesController
from .throttling import LoginRateThrottle, RefreshRateThrottle
from .CookieAuth import set_auth_cookies, COOKIE_REFRESH
from .LogoutController import LogoutController

User = get_user_model()


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Login: valida credenciales y devuelve tokens en body + cookies HTTP-Only."""
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        if username:
            try:
                user = User.objects.get(username=username)
                from modulos.roles.infraestructura.models import UsuarioRolModel
                if UsuarioRolModel.objects.filter(usuario=user, rol__codigo='consulta_publica', activo=True).exists():
                    return Response({'detail': 'La consulta pública no tiene permisos para iniciar sesión.'}, status=403)
            except User.DoesNotExist:
                pass
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            set_auth_cookies(response, response.data.get('access', ''), response.data.get('refresh'))
        return response


class ThrottledTokenRefreshView(TokenRefreshView):
    """Refresh: acepta el refresh token del body O de la cookie; devuelve nuevas cookies."""
    throttle_classes = [RefreshRateThrottle]

    def post(self, request, *args, **kwargs):
        # Si no viene refresh en el body, leer desde cookie (flujo web)
        if 'refresh' not in request.data and COOKIE_REFRESH in request.COOKIES:
            data = request.data.copy()
            data['refresh'] = request.COOKIES[COOKIE_REFRESH]
            request._data = data
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            set_auth_cookies(response, response.data.get('access', ''), response.data.get('refresh'))
        return response


urlpatterns = [
    path('token/', ThrottledTokenObtainPairView.as_view(), name='token-obtain'),
    path('token/refresh/', ThrottledTokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutController.as_view(), name='logout'),
    path('perfil/foto/', FotoPerfilController.as_view(), name='perfil-foto'),
    path('cambiar-clave/', CambiarClaveController.as_view(), name='cambiar-clave'),
    path('perfil/', MiPerfilController.as_view(), name='mi-perfil'),
    path('mi-acceso/', MiAccesoController.as_view(), name='mi-acceso'),
    path('usuarios/', UsuariosListController.as_view(), name='usuarios-list'),
    path('usuarios/<int:user_id>/', UsuarioDetailController.as_view(), name='usuario-detail'),
    path('usuarios/<int:user_id>/asignaciones/', UsuarioAsignacionesController.as_view(), name='usuario-asignaciones'),
]

