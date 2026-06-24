"""
Configuración global de pytest.
Suprime el bug Python 3.14 + Django 5.0 (copy() de contexto de plantilla en AdminEmailHandler).
"""
import pytest
from unittest.mock import patch


@pytest.fixture(autouse=True)
def suppress_py314_django_logging_bug():
    """
    En Python 3.14, django.template.context.BaseContext.__copy__ falla porque
    super().__copy__() no copia el dict de instancia. El AdminEmailHandler
    intenta renderizar la traza del error como plantilla, lo cual invoca el bug.
    Silenciar el emit del handler no afecta la respuesta HTTP real del test.
    """
    with patch('django.utils.log.AdminEmailHandler.emit', return_value=None):
        yield
