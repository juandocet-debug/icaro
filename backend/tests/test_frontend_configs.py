import os

def test_no_axios_imports_in_presentation():
    # LoginScreen.tsx y HomeScreen.tsx no deben importar axios directamente
    login_screen_path = '../frontend/src/modules/auth/presentation/LoginScreen.tsx'
    home_screen_path = '../frontend/src/modules/home/presentation/HomeScreen.tsx'
    
    assert os.path.exists(login_screen_path)
    assert os.path.exists(home_screen_path)
    
    with open(login_screen_path, 'r', encoding='utf-8') as f:
        login_content = f.read()
    with open(home_screen_path, 'r', encoding='utf-8') as f:
        home_content = f.read()
        
    assert 'import axios' not in login_content
    assert 'from \'axios\'' not in login_content
    assert 'import axios' not in home_content
    assert 'from \'axios\'' not in home_content

def test_login_screen_uses_shared_components():
    login_screen_path = '../frontend/src/modules/auth/presentation/LoginScreen.tsx'
    with open(login_screen_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ticket 23 (dark theme): Button y TextField reemplazados por primitivos nativos
    # para control total del diseño oscuro. Solo ErrorMessage es requerido.
    assert 'ErrorMessage' in content
    assert 'import axios' not in content

def test_no_hardcoded_backend_urls_in_frontend():
    # Buscar en toda la carpeta frontend/src/ si hay urls hardcodeadas
    frontend_src = '../frontend/src/'
    url_pattern = 'http://localhost:8000'
    
    found_urls = []
    for root, dirs, files in os.walk(frontend_src):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if url_pattern in content:
                        found_urls.append(path)
                        
    # No deben encontrarse URLs hardcodeadas en src/
    assert len(found_urls) == 0, f"Found hardcoded URLs in: {found_urls}"

def test_no_async_storage_for_tokens():
    # SecureTokenStorage no debe utilizar AsyncStorage para guardar tokens
    storage_path = '../frontend/src/modules/auth/infrastructure/SecureTokenStorage.ts'
    assert os.path.exists(storage_path)
    
    with open(storage_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    assert '@react-native-async-storage/async-storage' not in content
    assert 'AsyncStorage' not in content

def test_clean_architecture_domain_restrictions():
    # El dominio no debe importar React, Axios ni expo-secure-store
    domain_dir = '../frontend/src/modules/auth/domain/'
    for root, dirs, files in os.walk(domain_dir):
        for file in files:
            if file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    assert 'import React' not in content
                    assert 'react' not in content.lower()
                    assert 'axios' not in content.lower()
                    assert 'expo-secure-store' not in content.lower()

def test_clean_architecture_application_restrictions():
    # La aplicación no debe importar React ni componentes visuales
    app_dir = '../frontend/src/modules/auth/application/'
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    assert 'import React' not in content
                    assert 'react' not in content.lower()
                    assert 'shared/components' not in content
