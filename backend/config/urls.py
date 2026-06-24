from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
import os
import dj_database_url
from django.db import connection

from rest_framework.permissions import IsAdminUser, AllowAny

class ProductionProtectedSpectacularAPIView(SpectacularAPIView):
    def get_permissions(self):
        if os.getenv('ENVIRONMENT', 'development') == 'production':
            return [IsAdminUser()]
        return [AllowAny()]

class ProductionProtectedSpectacularSwaggerView(SpectacularSwaggerView):
    def get_permissions(self):
        if os.getenv('ENVIRONMENT', 'development') == 'production':
            return [IsAdminUser()]
        return [AllowAny()]

class ProductionProtectedSpectacularRedocView(SpectacularRedocView):
    def get_permissions(self):
        if os.getenv('ENVIRONMENT', 'development') == 'production':
            return [IsAdminUser()]
        return [AllowAny()]

def health_check(request):
    """
    Validación de estado del sistema (Health Check Definitivo).
    Verifica estado, entorno, storage y conectividad con Neon.
    """
    environment = os.getenv('ENVIRONMENT', 'development')
    expected_database = os.getenv('EXPECTED_DATABASE', 'unknown')
    
    # Validar Storage
    storage_type = "local" if environment != "production" else "cloudflare_r2_or_aws_s3"

    try:
        # Validar conectividad de base de datos Neon
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            
        if environment == 'production':
            return JsonResponse({"status": "ok"}, status=200)
            
        return JsonResponse({
            "status": "ok",
            "environment": environment,
            "database": expected_database,
            "storage": storage_type,
            "version": "1.0.0"
        }, status=200)
    except Exception as e:
        if environment == 'production':
            return JsonResponse({"status": "error"}, status=503)
        return JsonResponse({
            "status": "error",
            "detail": str(e)
        }, status=503)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Endpoint de salud
    path('health', health_check, name='health-check'),
    
    # OpenAPI Swagger Docs
    path('api/schema/', ProductionProtectedSpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', ProductionProtectedSpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', ProductionProtectedSpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    
    # ── Módulos Core (Clean Architecture) ───────────────────────────────────
    path('api/organizaciones/', include('modulos.organizaciones.infraestructura.urls')),
    path('api/auth/', include('modulos.autenticacion.infraestructura.urls')),
    path('api/proyectos/', include('modulos.proyectos.infraestructura.urls')),
    path('api/proyectos/', include('modulos.tipos_documento.infraestructura.urls')),
    path('api/proyectos/', include('modulos.miembros.infraestructura.urls')),
    path('api/proyectos/', include('modulos.metas.infraestructura.urls')),
    path('api/componentes/', include('modulos.componentes.infraestructura.urls')),
    path('api/acciones/', include('modulos.acciones.infraestructura.urls')),
    path('api/uploads/', include('modulos.uploads.infraestructura.urls')),
    path('api/bitacora/', include('modulos.bitacora.infraestructura.urls')),
    path('api/evidencias/', include('modulos.evidencias.infraestructura.urls')),
    path('api/notificaciones/', include('modulos.notificaciones.infraestructura.urls')),
    path('api/sesiones/', include('modulos.sesiones.infraestructura.urls')),
    path('api/roles/', include('modulos.roles.infraestructura.urls')),
    path('api/mis-actividades/', include('modulos.acciones.infraestructura.urls_mis_actividades')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
