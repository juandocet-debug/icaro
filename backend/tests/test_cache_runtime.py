import pytest
import os
from django.test import override_settings
from django.conf import settings

def test_redis_cache_library_installed():
    try:
        import redis
        assert redis.__version__ is not None
    except ImportError:
        pytest.fail("The 'redis' package is not installed or importable.")

def test_redis_cache_backend_resolves():
    from django.core.cache.backends.redis import RedisCache
    assert issubclass(RedisCache, object)

@override_settings(
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': 'redis://localhost:6379/0',
        }
    }
)
def test_django_redis_cache_instantiation():
    from django.core.cache import caches
    # This checks that settings validation and importing of RedisCache passes.
    # We do not verify cache connections, only class resolution.
    redis_cache = caches['default']
    assert redis_cache.__class__.__name__ == 'RedisCache'
