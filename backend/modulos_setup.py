import os
import sys

BASE_DIR = r"C:\Users\SOPORTE\Documents\upn\Proyectos\Icaro\backend\modulos"
apps = [
    "organizaciones", "autenticacion", "auditoria", "proyectos",
    "componentes", "acciones", "uploads", "sesiones", "evidencias",
    "bitacora", "notificaciones"
]

os.makedirs(BASE_DIR, exist_ok=True)
with open(os.path.join(BASE_DIR, "__init__.py"), "w") as f:
    pass

for app in apps:
    app_dir = os.path.join(BASE_DIR, app)
    os.makedirs(app_dir, exist_ok=True)
    
    # Create migrations dir
    mig_dir = os.path.join(app_dir, "migrations")
    os.makedirs(mig_dir, exist_ok=True)
    with open(os.path.join(mig_dir, "__init__.py"), "w") as f:
        pass

    with open(os.path.join(app_dir, "__init__.py"), "w") as f:
        pass
    with open(os.path.join(app_dir, "apps.py"), "w") as f:
        f.write(f"from django.apps import AppConfig\n\nclass {app.capitalize()}Config(AppConfig):\n    default_auto_field = 'django.db.models.BigAutoField'\n    name = 'modulos.{app}'\n")
    with open(os.path.join(app_dir, "models.py"), "w") as f:
        f.write("from django.db import models\n")
    with open(os.path.join(app_dir, "views.py"), "w") as f:
        f.write("from rest_framework import viewsets\n")
    with open(os.path.join(app_dir, "serializers.py"), "w") as f:
        f.write("from rest_framework import serializers\n")
    with open(os.path.join(app_dir, "urls.py"), "w") as f:
        f.write("from django.urls import path, include\nfrom rest_framework.routers import DefaultRouter\n\nrouter = DefaultRouter()\n\nurlpatterns = [\n    path('', include(router.urls)),\n]\n")

print("Estructura de modulos creada correctamente.")
