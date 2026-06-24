from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .CookieAuth import COOKIE_REFRESH, clear_auth_cookies


class LogoutController(APIView):
    """
    POST /api/auth/logout/
    Invalida el refresh token en la blacklist y limpia las cookies HTTP-Only.
    Compatible con web (cookie) y native (refresh en body).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh') or request.COOKIES.get(COOKIE_REFRESH)
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass

        response = Response({'ok': True, 'mensaje': 'Sesión cerrada.'})
        clear_auth_cookies(response)
        return response
