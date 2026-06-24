import subprocess
import pytest
import sys
import os

@pytest.mark.django_db
def test_production_fails_missing_s3_credentials():
    env = os.environ.copy()
    env['ENVIRONMENT'] = 'production'
    # Variables base para saltar validación de DB
    env['EXPECTED_DATABASE'] = 'icaro_prod'
    env['DATABASE_URL'] = 'sqlite:///icaro_prod_dummy.sqlite3'
    env['SECRET_KEY'] = 'dummy'
    env['FIELD_ENCRYPTION_KEY'] = 'dummy'
    
    # Proveemos todas las demás credenciales
    env['AWS_ACCESS_KEY_ID'] = 'dummy'
    env['AWS_SECRET_ACCESS_KEY'] = 'dummy'
    env['AWS_STORAGE_BUCKET_NAME'] = 'dummy'
    
    # Quitamos una obligatoria para simular el fallo
    env.pop('AWS_S3_ENDPOINT_URL', None)
    
    # Manage.py check falla si settings lanza ImproperlyConfigured
    result = subprocess.run(
        [sys.executable, 'manage.py', 'check'], 
        env=env, capture_output=True, text=True
    )
    
    assert result.returncode != 0
    assert 'ImproperlyConfigured' in result.stderr
    assert 'Faltan credenciales: AWS_S3_ENDPOINT_URL' in result.stderr

@pytest.mark.django_db
def test_production_passes_with_all_s3_credentials():
    env = os.environ.copy()
    env['ENVIRONMENT'] = 'production'
    # Todas las credenciales necesarias
    env['AWS_ACCESS_KEY_ID'] = 'dummy'
    env['AWS_SECRET_ACCESS_KEY'] = 'dummy'
    env['AWS_STORAGE_BUCKET_NAME'] = 'dummy'
    env['AWS_S3_ENDPOINT_URL'] = 'https://dummy.r2.com'
    
    # Variables base
    env['EXPECTED_DATABASE'] = 'icaro_prod'
    env['DATABASE_URL'] = 'sqlite:///icaro_prod_dummy.sqlite3'
    env['SECRET_KEY'] = 'dummy'
    env['FIELD_ENCRYPTION_KEY'] = 'dummy'
    
    result = subprocess.run(
        [sys.executable, 'manage.py', 'check'], 
        env=env, capture_output=True, text=True
    )
    
    assert result.returncode == 0

def test_cache_and_static_root_settings():

    from django.conf import settings
    # Static root must exist and the folder should have been created
    assert os.path.exists(settings.STATIC_ROOT)
    
    # Default cache must be defined
    assert 'default' in settings.CACHES

