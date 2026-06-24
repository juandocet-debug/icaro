import os
import sys

def check_no_axios_in_screens():
    errors = []
    login_screen_path = 'frontend/src/modules/auth/presentation/LoginScreen.tsx'
    home_screen_path = 'frontend/src/modules/home/presentation/HomeScreen.tsx'
    
    for path in [login_screen_path, home_screen_path]:
        if not os.path.exists(path):
            errors.append(f"File not found: {path}")
            continue
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'import axios' in content or "from 'axios'" in content or 'import * as axios' in content:
            errors.append(f"{path} must not import axios directly.")
    return errors

def check_login_screen_uses_shared_components():
    errors = []
    login_screen_path = 'frontend/src/modules/auth/presentation/LoginScreen.tsx'
    if not os.path.exists(login_screen_path):
        return [f"File not found: {login_screen_path}"]

    with open(login_screen_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ticket 23 (dark theme): Button y TextField reemplazados por primitivos nativos
    # para control total del tema oscuro. Solo ErrorMessage es requerido.
    required_components = ['ErrorMessage']
    for component in required_components:
        if component not in content:
            errors.append(f"LoginScreen.tsx should use shared component: {component}")
    return errors

def check_no_hardcoded_urls():
    errors = []
    frontend_dir = 'frontend'
    for root, dirs, files in os.walk(frontend_dir):
        # Skip node_modules folder
        if 'node_modules' in root.split(os.sep):
            continue
        for file in files:
            # Skip .env.example
            if file == '.env.example':
                continue
            # Scan TS/TSX files
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if 'http://localhost:8000' in content or '127.0.0.1:8000' in content:
                    errors.append(f"Hardcoded API URL found in {path}")
    return errors

def check_no_async_storage_for_tokens():
    errors = []
    storage_path = 'frontend/src/modules/auth/infrastructure/SecureTokenStorage.ts'
    if not os.path.exists(storage_path):
        return [f"File not found: {storage_path}"]
    with open(storage_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if '@react-native-async-storage/async-storage' in content or 'AsyncStorage' in content:
        errors.append(f"SecureTokenStorage must not use AsyncStorage to store tokens.")
    return errors

def check_clean_arch_imports():
    errors = []
    frontend_dir = 'frontend/src'
    for root, dirs, files in os.walk(frontend_dir):
        if 'presentation' in root.split(os.sep):
            for file in files:
                if file.endswith(('.ts', '.tsx')):
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if 'import axios' in content or "from 'axios'" in content:
                        errors.append(f"{path} (presentation) must not import axios directly.")
                    if 'new Axios' in content:
                        errors.append(f"{path} (presentation) must not instantiate repositories directly (e.g., 'new Axios...'). Use dependencies instead.")
    return errors

def main():
    print("Running Clean Architecture Frontend Validation...")
    errors = []
    errors.extend(check_no_axios_in_screens())
    errors.extend(check_login_screen_uses_shared_components())
    errors.extend(check_no_hardcoded_urls())
    errors.extend(check_no_async_storage_for_tokens())
    errors.extend(check_clean_arch_imports())
    
    if errors:
        print("\nValidation FAILED with the following errors:")
        for error in errors:
            print(f" - {error}")
        sys.exit(1)
    else:
        print("\nValidation PASSED successfully!")
        sys.exit(0)

if __name__ == '__main__':
    main()
