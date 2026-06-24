@echo off
title Icaro - Iniciando Entorno de Desarrollo (icaro_dev)
color 0A

echo.
echo  ==============================================
echo    ICARO - Iniciando Plataforma de Desarrollo
echo  ==============================================
echo.

:: Forzar variables para evitar conectar a PROD localmente
set ENVIRONMENT=development
set EXPECTED_DATABASE=icaro_dev

:: Matar procesos anteriores
echo [1/4] Limpiando procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Verificar puerto 19006
echo [2/4] Verificando puerto 19006...
netstat -ano | findstr :19006 >nul 2>&1
if %errorlevel%==0 (
    echo     Puerto 19006 ocupado, liberando...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :19006 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo [2b/4] Verificando puerto 8000...
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel%==0 (
    echo     Puerto 8000 ocupado, liberando...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
)

:: Levantar Backend Django
echo [3/4] Levantando Backend Django (puerto 8000)...
start "ICARO - Backend Django" cmd /k "cd /d %~dp0backend && set ENVIRONMENT=development&& set EXPECTED_DATABASE=icaro_dev&& call venv\Scripts\activate && python manage.py runserver 8000"

timeout /t 3 /nobreak >nul

:: Levantar Frontend Expo
echo [4/4] Levantando Frontend Expo Web (puerto 19006)...
start "ICARO - Frontend Expo" cmd /k "cd /d %~dp0frontend && set BROWSER=none && npx expo start --web --port 19006"

echo.
echo  ==============================================
echo    Listo! Esperando que cargue...
echo  ==============================================
echo.
echo  Backend API:  http://localhost:8000/api
echo  Swagger UI:   http://localhost:8000/api/docs/
echo  Frontend:     http://localhost:19006
echo.
echo  Abriendo navegador en 8 segundos...
timeout /t 8 /nobreak >nul
start "" "http://localhost:19006"

pause
