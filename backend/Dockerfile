FROM python:3.12-slim

# Evitar que Python escriba archivos .pyc y forzar buffer de salida para logs en vivo
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema requeridas para construir/ejecutar el backend
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente del proyecto
COPY . /app/

# Crear un usuario de sistema sin privilegios para ejecutar la aplicación de forma segura
RUN groupadd -r webgroup && useradd -r -g webgroup -d /app -s /sbin/nologin webuser \
    && chown -R webuser:webgroup /app

# Otorgar permisos de ejecución al script de entrada (entrypoint.sh)
RUN chmod +x /app/entrypoint.sh

# Cambiar al usuario sin privilegios
USER webuser

# Exponer el puerto por defecto (8000), Railway utilizará la variable $PORT de forma dinámica
EXPOSE 8000

# Usar el script de entrada para ejecutar las tareas de runtime
ENTRYPOINT ["/app/entrypoint.sh"]
