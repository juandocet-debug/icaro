#!/bin/sh
set -e

echo "==> Ejecutando collectstatic..."
python manage.py collectstatic --noinput

echo "==> Ejecutando migraciones..."
python manage.py migrate --noinput

echo "==> Iniciando gunicorn en el puerto ${PORT:-8000}..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
