# Guía de Despliegue Backend en Railway

Este documento describe la configuración y el procedimiento para realizar el despliegue del backend de Ícaro en la plataforma Railway utilizando contenedores Docker.

## 1. Requisitos Previos
1. Una cuenta activa en [Railway](https://railway.app/).
2. Una base de datos Neon PostgreSQL activa.
3. Un bucket de Cloudflare R2 o AWS S3 configurado.

## 2. Variables de Entorno Requeridas en Railway
Las siguientes variables de entorno deben inyectarse a través del panel de control de Railway:

| Variable | Descripción / Ejemplo |
|---|---|
| `ENVIRONMENT` | Debe ser `production` |
| `SECRET_KEY` | Llave secreta y robusta de Django |
| `FIELD_ENCRYPTION_KEY` | Clave simétrica base64 de 32 bytes |
| `EXPECTED_DATABASE` | Nombre de base de datos esperado (ej: `icaro_prod`) |
| `DATABASE_URL` | String de conexión Neon PostgreSQL (`sslmode=require`) |
| `ALLOWED_HOSTS` | Dominios de la app (ej: `.up.railway.app,localhost`) |
| `CORS_ALLOWED_ORIGINS` | Orígenes del frontend permitidos (ej: `https://tu-frontend.vercel.app`) |
| `CSRF_TRUSTED_ORIGINS` | Orígenes del frontend de confianza para CSRF |
| `AWS_ACCESS_KEY_ID` | Identificador de clave de acceso AWS S3/R2 |
| `AWS_SECRET_ACCESS_KEY` | Clave secreta de acceso AWS S3/R2 |
| `AWS_STORAGE_BUCKET_NAME` | Nombre de tu bucket |
| `AWS_S3_ENDPOINT_URL` | URL del endpoint de Cloudflare R2 / AWS S3 |
| `AWS_S3_REGION_NAME` | Región del S3 (ej: `us-east-1` o `auto`) |
| `CACHE_URL` | URL de conexión de la instancia Redis de Railway (ej. `redis://...`) |

---

## 3. Estrategia de Inicio (Runtime Initialization)
El despliegue está automatizado mediante el archivo [Dockerfile](Dockerfile) y el script [entrypoint.sh](entrypoint.sh).

Durante la compilación/construcción (Build phase):
- No se ejecutan consultas de base de datos ni `collectstatic`.
- Se genera un contenedor ligero basado en `python:3.12-slim` con usuario no-privilegiado `webuser`.

Durante el arranque del contenedor (Runtime phase):
1. Se ejecutan los archivos estáticos mediante `python manage.py collectstatic --noinput`.
2. Se migran los esquemas de base de datos automáticamente con `python manage.py migrate --noinput`.
3. Se inicia la aplicación con el servidor WSGI **Gunicorn** en el puerto `$PORT` dinámico provisto por Railway:
   `gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}`

---

## 4. Verificación Post-Despliegue
Una vez finalizado el deploy en Railway, se deben realizar las siguientes validaciones REST:

1. **Estado del Sistema**:
   `GET https://tu-servicio-railway.up.railway.app/health`
   Debe retornar HTTP `200 OK` con información del entorno y conectividad a base de datos Neon.
   
2. **Esquema OpenAPI**:
   `GET https://tu-servicio-railway.up.railway.app/api/schema/`
   Debe retornar HTTP `403 Forbidden` a usuarios no administradores en producción (protección por contrato de Swagger).

3. **Autenticación (JWT)**:
   `POST https://tu-servicio-railway.up.railway.app/api/auth/token/`
   Debe permitir obtener tokens JWT con rate limiting activo.
