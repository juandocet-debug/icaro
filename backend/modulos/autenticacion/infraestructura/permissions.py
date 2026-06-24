from rest_framework.permissions import BasePermission

# Rutas que SIEMPRE se permiten aunque el usuario tenga must_change_password=True
_RUTAS_PERMITIDAS = (
    '/api/auth/cambiar-clave/',
    '/api/auth/perfil/',
    '/api/auth/logout/',
    '/api/auth/token/refresh/',
    '/api/auth/mi-acceso/',
)


class RestringidoPorClaveTemporal(BasePermission):
    """
    Bloquea el acceso a cualquier endpoint de negocio si el usuario
    tiene must_change_password=True, obligando a pasar por el flujo
    de cambio de contraseña antes de operar con la plataforma.

    Rutas siempre permitidas: cambiar-clave, perfil, logout, refresh, mi-acceso.
    """

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return True  # La autenticación la gestiona IsAuthenticated

        if any(request.path.startswith(ruta) for ruta in _RUTAS_PERMITIDAS):
            return True

        perfil = getattr(request.user, 'profile', None)
        if perfil and getattr(perfil, 'must_change_password', False):
            return False

        return True
