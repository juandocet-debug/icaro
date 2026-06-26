"""
Autenticación JWT que acepta el token desde la cabecera Authorization
O desde una cookie HTTP-Only ('icaro_access').

Prioridad: Authorization header > cookie.
En web se usan cookies; en mobile sigue el flujo normal de header.
"""
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

COOKIE_ACCESS  = 'icaro_access'
COOKIE_REFRESH = 'icaro_refresh'
COOKIE_MAX_AGE_ACCESS  = 60 * 60        # 1 hora (igual que ACCESS_TOKEN_LIFETIME)
COOKIE_MAX_AGE_REFRESH = 60 * 60 * 24  # 1 día  (igual que REFRESH_TOKEN_LIFETIME)


def _cookie_kwargs() -> dict:
    """Parámetros comunes para las cookies de sesión."""
    is_prod = not settings.DEBUG
    return dict(
        httponly=True,
        secure=is_prod,       # HTTPS obligatorio en producción
        # SameSite=None es necesario en producción cuando frontend y backend
        # están en dominios distintos (Vercel → Railway).
        # En desarrollo usamos Lax (localhost mismo origen).
        samesite='None' if is_prod else 'Lax',
    )


def set_auth_cookies(response, access: str, refresh: str | None = None):
    """Inyecta las cookies en una respuesta ya construida."""
    response.set_cookie(COOKIE_ACCESS, access, max_age=COOKIE_MAX_AGE_ACCESS, **_cookie_kwargs())
    if refresh:
        response.set_cookie(COOKIE_REFRESH, refresh, max_age=COOKIE_MAX_AGE_REFRESH, **_cookie_kwargs())


def clear_auth_cookies(response):
    """Elimina las cookies de sesión."""
    response.delete_cookie(COOKIE_ACCESS)
    response.delete_cookie(COOKIE_REFRESH)


class CookieOrHeaderJWTAuthentication(JWTAuthentication):
    """
    Extiende simplejwt para leer el access token desde:
      1. Authorization: Bearer <token>  (mobile / fallback)
      2. Cookie 'icaro_access'           (web)
    """

    def authenticate(self, request):
        # Intentar el flujo normal de header
        try:
            result = super().authenticate(request)
            if result is not None:
                return result
        except (InvalidToken, TokenError):
            pass

        # Fallback: leer desde cookie
        raw_token = request.COOKIES.get(COOKIE_ACCESS)
        if not raw_token:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return user, validated_token
        except (InvalidToken, TokenError):
            return None


