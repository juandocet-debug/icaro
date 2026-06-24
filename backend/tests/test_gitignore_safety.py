import os
from django.conf import settings

def test_gitignore_contains_rules():
    backend_dir = settings.BASE_DIR
    root_dir = os.path.dirname(backend_dir)
    gitignore_path = os.path.join(root_dir, '.gitignore')
    
    assert os.path.exists(gitignore_path), ".gitignore does not exist in root directory"
    
    with open(gitignore_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    lines = [line.strip() for line in content.splitlines()]
    
    required_rules = [
        '.env',
        '!.env.example',
        'venv/',
        '__pycache__/',
        '*.sqlite3',
        '*.db',
        'node_modules/',
        '.coverage',
        '.pytest_cache/',
    ]
    
    for rule in required_rules:
        assert rule in lines, f"Rule '{rule}' is missing in .gitignore"
