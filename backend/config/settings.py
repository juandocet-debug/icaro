"""
Django settings for Icaro project.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url
from django.core.exceptions import ImproperlyConfigured

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Validaciones Obligatorias de Entorno (Aislamiento Total) ───────────────────
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
EXPECTED_DATABASE = os.getenv('EXPECTED_DATABASE')
DATABASE_URL = os.getenv('DATABASE_URL')

if not EXPECTED_DATABASE:
    raise ImproperlyConfigured("Falta la variable de entorno obligatoria: EXPECTED_DATABASE.")

if not DATABASE_URL:
    raise ImproperlyConfigured("Falta la variable de entorno obligatoria: DATABASE_URL.")

if EXPECTED_DATABASE not in DATABASE_URL:
    print(f"CRÍTICO: Intentando conectar a una BD no esperada.")
    print(f"Entorno: {ENVIRONMENT} | Base Esperada: {EXPECTED_DATABASE} | URL apunta a: ...")
    raise ImproperlyConfigured(f"La base configurada en DATABASE_URL no corresponde a {EXPECTED_DATABASE}.")

# ── Seguridad Base ─────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ImproperlyConfigured("Falta la variable de entorno obligatoria: SECRET_KEY.")

FIELD_ENCRYPTION_KEY = os.getenv('FIELD_ENCRYPTION_KEY')
if not FIELD_ENCRYPTION_KEY:
    raise ImproperlyConfigured("Falta la variable obligatoria: FIELD_ENCRYPTION_KEY.")

DEBUG = ENVIRONMENT == 'development'

raw_hosts = os.getenv('ALLOWED_HOSTS')
if raw_hosts:
    ALLOWED_HOSTS = [host.strip() for host in raw_hosts.split(',') if host.strip()]
else:
    ALLOWED_HOSTS = ['*'] if DEBUG else [
        'icaro-production.up.railway.app',
        'localhost',
        '127.0.0.1',
    ]


raw_csrf = os.getenv('CSRF_TRUSTED_ORIGINS')
if raw_csrf:
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in raw_csrf.split(',') if origin.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:19006',
        'http://localhost:19007',
    ] if DEBUG else [
        'https://icaro-production.up.railway.app',
        'https://tu-frontend.vercel.app',
    ]

if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:19006',
        'http://localhost:8081',
        'http://127.0.0.1:19006',
        'http://127.0.0.1:8081',
    ]
    # También permitir orígenes adicionales de la variable de entorno en desarrollo
    _cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '')
    if _cors_origins:
        CORS_ALLOWED_ORIGINS.extend([o.strip() for o in _cors_origins.split(',') if o.strip()])
else:
    # Leer orígenes de variable de entorno separados por coma
    _cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '')
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
    CORS_ALLOW_ALL_ORIGINS = False

# Obligatorio para que el navegador envíe cookies en peticiones cross-origin
CORS_ALLOW_CREDENTIALS = True


# ── Aplicaciones ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Terceros
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    
    # Módulos Icaro (Clean Architecture - app registrada en infraestructura/)
    'modulos.organizaciones.infraestructura',
    'modulos.autenticacion.infraestructura',
    'modulos.auditoria.infraestructura',
    'modulos.miembros.infraestructura',
    'modulos.proyectos.infraestructura',
    'modulos.componentes.infraestructura',
    'modulos.acciones.infraestructura',
    'modulos.uploads.infraestructura',
    'modulos.sesiones.infraestructura',
    'modulos.evidencias.infraestructura',
    'modulos.bitacora.infraestructura',
    'modulos.notificaciones.infraestructura',
    'modulos.tipos_documento.infraestructura',
    'modulos.roles.infraestructura',
    'modulos.metas.infraestructura',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Middleware de Auditoría (Clean Architecture - delega al UseCase)
    'modulos.auditoria.infraestructura.middleware.AuditLogMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Caché (Redis opcional — activo si se define REDIS_URL) ───────────────────
_redis_url = os.getenv('REDIS_URL', '')
if _redis_url:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': _redis_url,
            'TIMEOUT': 300,
            'KEY_PREFIX': 'icaro',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# ── Base de Datos (Neon PostgreSQL) ───────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ── Validación de contraseñas ─────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internacionalización ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# ── Almacenamiento Estático ───────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
os.makedirs(STATIC_ROOT, exist_ok=True)

# ── Configuración de Caché (Rate Limiting y otros) ─────────────────────────────
CACHE_URL = os.getenv('CACHE_URL') or os.getenv('REDIS_URL')
if CACHE_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': CACHE_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'icaro-rate-limiting-locmem',
        }
    }


# ── Storage (Desacoplado Django 4.2+) ─────────────────────────────────────────
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
}

# Permitir archivos de hasta 52MB en memoria para que el controller
# pueda validar el límite de 20MB o 50MB con su propio mensaje de error.
DATA_UPLOAD_MAX_MEMORY_SIZE = 52 * 1024 * 1024   # 52 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 52 * 1024 * 1024   # 52 MB

_CLOUDINARY_URL = os.getenv('CLOUDINARY_URL', '')
_AWS_KEY        = os.getenv('AWS_ACCESS_KEY_ID', '')

if _CLOUDINARY_URL:
    # ── Cloudinary (CDN + transformaciones + WebP automático) ─────────────────
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
    CLOUDINARY_STORAGE = {
        'CLOUDINARY_URL': _CLOUDINARY_URL,
        'MAGIC_FILE_PATH': None,
        'INVALID_VIDEO_ERROR_MESSAGE': 'Por favor sube un archivo de video válido.',
        'EXCLUDE_DELETE_ORPHANED_MEDIA_UNDER_FOLDER': '',
        'STATIC_TAG': 'static',
        'STATICFILES_MANIFEST_ROOT': os.path.join(BASE_DIR, 'manifest'),
    }
    STORAGES["default"]["BACKEND"] = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = '/media/'  # Cloudinary ignora este valor pero Django lo requiere

elif _AWS_KEY:
    # ── Cloudflare R2 / AWS S3 (fallback si no hay Cloudinary) ───────────────
    _secret = os.getenv('AWS_SECRET_ACCESS_KEY')
    _bucket = os.getenv('AWS_STORAGE_BUCKET_NAME')
    _endpoint = os.getenv('AWS_S3_ENDPOINT_URL')
    if not all([_secret, _bucket, _endpoint]):
        _faltantes = []
        if not _secret: _faltantes.append('AWS_SECRET_ACCESS_KEY')
        if not _bucket: _faltantes.append('AWS_STORAGE_BUCKET_NAME')
        if not _endpoint: _faltantes.append('AWS_S3_ENDPOINT_URL')
        raise ImproperlyConfigured(f"Faltan credenciales: {', '.join(_faltantes)}")

    STORAGES["default"]["BACKEND"] = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID       = _AWS_KEY
    AWS_SECRET_ACCESS_KEY   = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL     = os.getenv('AWS_S3_ENDPOINT_URL')
    AWS_S3_CUSTOM_DOMAIN    = os.getenv('AWS_S3_CUSTOM_DOMAIN', '')
    AWS_DEFAULT_ACL         = None
    AWS_S3_FILE_OVERWRITE   = True
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400, public'}
    AWS_QUERYSTRING_AUTH    = False
    AWS_S3_REGION_NAME      = 'auto'
    AWS_S3_SIGNATURE_VERSION = 's3v4'

elif ENVIRONMENT == 'production':
    raise ImproperlyConfigured(
        "En producción se requiere CLOUDINARY_URL o credenciales AWS (AWS_ACCESS_KEY_ID, etc.)."
    )

else:
    MEDIA_URL  = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ── Django REST Framework & JWT ───────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'modulos.autenticacion.infraestructura.CookieAuth.CookieOrHeaderJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        'modulos.autenticacion.infraestructura.permissions.RestringidoPorClaveTemporal',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'auth_login': '5/min',
        'auth_refresh': '20/min',
        'auth_password_change': '5/hour',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# ── Configuración OpenAPI / Swagger ───────────────────────────────────────────
# ── Seguridad HTTP ────────────────────────────────────────────────────────────
X_FRAME_OPTIONS          = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER   = True

if not DEBUG:
    SECURE_SSL_REDIRECT          = True
    SECURE_HSTS_SECONDS          = 31536000   # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD          = True
    SESSION_COOKIE_SECURE        = True
    SESSION_COOKIE_HTTPONLY      = True
    CSRF_COOKIE_SECURE           = True
    CSRF_COOKIE_HTTPONLY         = True

SPECTACULAR_SETTINGS = {
    'TITLE': 'Icaro API',
    'DESCRIPTION': 'Documentación de la Plataforma de Gestión Documental CORPOACIIC',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SERVE_PERMISSIONS': [
        'rest_framework.permissions.IsAdminUser'
        if os.getenv('ENVIRONMENT', 'development') == 'production'
        else 'rest_framework.permissions.AllowAny'
    ],
}
