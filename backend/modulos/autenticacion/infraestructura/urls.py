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

    # Configuración de lockout
    _MAX_INTENTOS  = 10     # intentos fallidos antes de bloquear
    _LOCKOUT_SEG   = 900    # 15 minutos de bloqueo

    def _cache_key(self, username: str) -> str:
        return f"login_fails:{username.lower().strip()}"

    def post(self, request, *args, **kwargs):
        from django.core.cache import cache

        username = (request.data.get('username') or '').strip()

        # ── Guardia: bloquear si ya tiene demasiados intentos ──────────────────
        if username:
            key      = self._cache_key(username)
            intentos = cache.get(key, 0)
            if intentos >= self._MAX_INTENTOS:
                ttl = cache.ttl(key) if hasattr(cache, 'ttl') else self._LOCKOUT_SEG
                return Response(
                    {
                        'detail': (
                            f'Cuenta bloqueada temporalmente por múltiples intentos fallidos. '
                            f'Intente de nuevo en {ttl // 60 or 15} minutos.'
                        )
                    },
                    status=429
                )

            # ── Bloquear login de cuentas de consulta pública ─────────────────
            try:
                user = User.objects.get(username=username)
                from modulos.roles.infraestructura.models import UsuarioRolModel
                if UsuarioRolModel.objects.filter(usuario=user, rol__codigo='consulta_publica', activo=True).exists():
                    return Response({'detail': 'La consulta pública no tiene permisos para iniciar sesión.'}, status=403)
            except User.DoesNotExist:
                pass

        response = super().post(request, *args, **kwargs)

        # ── Actualizar contador según resultado ─────────────────────────────────
        if username:
            if response.status_code == 200:
                # Login exitoso → resetear contador
                cache.delete(self._cache_key(username))
            else:
                # Fallo → incrementar contador con TTL
                key      = self._cache_key(username)
                intentos = cache.get(key, 0) + 1
                cache.set(key, intentos, timeout=self._LOCKOUT_SEG)

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

