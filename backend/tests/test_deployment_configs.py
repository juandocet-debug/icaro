import os
import re

def test_dockerfile_uses_non_root_user():
    dockerfile_path = 'Dockerfile'
    assert os.path.exists(dockerfile_path)
    
    with open(dockerfile_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Debe existir la instrucción USER y no ser root
    assert 'USER ' in content
    assert 'USER root' not in content
    assert 'USER webuser' in content

def test_dockerfile_does_not_execute_collectstatic_during_build():
    dockerfile_path = 'Dockerfile'
    assert os.path.exists(dockerfile_path)
    
    with open(dockerfile_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # No debe ejecutar collectstatic en las instrucciones de construcción (RUN)
    assert 'collectstatic' not in content

def test_entrypoint_sh_runs_collectstatic_migrate_and_gunicorn():
    entrypoint_path = 'entrypoint.sh'
    assert os.path.exists(entrypoint_path)
    
    with open(entrypoint_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Debe ejecutar collectstatic
    assert 'collectstatic' in content
    assert '--noinput' in content
    
    # Debe ejecutar migrate
    assert 'migrate' in content
    
    # Debe arrancar gunicorn en el puerto dinámico de Railway
    assert 'gunicorn' in content
    assert '${PORT:-8000}' in content

def test_settings_py_reads_allowed_hosts_from_env():
    settings_path = 'config/settings.py'
    assert os.path.exists(settings_path)
    
    with open(settings_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Debe buscar ALLOWED_HOSTS en las variables de entorno
    assert "os.getenv('ALLOWED_HOSTS')" in content or "os.environ.get('ALLOWED_HOSTS')" in content
    assert 'ALLOWED_HOSTS =' in content

def test_env_production_example_documents_allowed_hosts_and_port():
    example_path = '.env.production.example'
    assert os.path.exists(example_path)
    
    with open(example_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Debe documentar ALLOWED_HOSTS
    assert 'ALLOWED_HOSTS=' in content
    
    # Debe documentar PORT
    assert 'PORT=' in content

def test_gunicorn_is_in_requirements():
    requirements_path = 'requirements.txt'
    assert os.path.exists(requirements_path)
    
    with open(requirements_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Gunicorn debe estar presente para ser instalado en la imagen
    assert 'gunicorn' in content.lower()
