#!/bin/sh
set -e

echo "==> Ejecutando collectstatic..."
python manage.py collectstatic --noinput

echo "==> Ejecutando migraciones..."
python manage.py migrate --noinput

echo "==> Iniciando gunicorn en el puerto ${PORT:-8000}..."
# workers = 2×CPU+1 recomendado. En Railway Starter (1 vCPU): 4 workers × 2 threads = 8 slots concurrentes.
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${GUNICORN_WORKERS:-4} \
  --threads ${GUNICORN_THREADS:-2} \
  --worker-class gthread \
  --timeout ${GUNICORN_TIMEOUT:-60} \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 100
