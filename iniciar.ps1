$ErrorActionPreference = "SilentlyContinue"

$Host.UI.RawUI.WindowTitle = "Icaro - Plataforma de Desarrollo"
Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  ICARO - Iniciando Plataforma de Desarrollo" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# ── Rutas absolutas ────────────────────────────────────────────────────
$RootPath     = $PSScriptRoot
$BackendPath  = Join-Path $RootPath "backend"
$FrontendPath = Join-Path $RootPath "frontend"
$PythonExe    = Join-Path $BackendPath "venv\Scripts\python.exe"
$ManagePy     = Join-Path $BackendPath "manage.py"

# Verificar que el venv existe
if (-not (Test-Path $PythonExe)) {
    Write-Host "[ERROR] No se encontro el venv en $PythonExe" -ForegroundColor Red
    Write-Host "        Ejecuta: cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt" -ForegroundColor Yellow
    Read-Host "Presione Enter para salir"
    exit 1
}

# ── [1/5] Limpiar procesos anteriores ─────────────────────────────────
Write-Host "[1/5] Limpiando procesos anteriores..."
Stop-Process -Name node   -Force -ErrorAction SilentlyContinue
Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# ── [2/5] Liberar puertos ──────────────────────────────────────────────
Write-Host "[2/5] Liberando puertos 8000 y 19006..."
foreach ($port in @(8000, 19006)) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
}

# ── [3/5] Arrancar Django directamente con el Python del venv ──────────
Write-Host "[3/5] Arrancando Django en puerto 8000..."

# Setear variables de entorno ANTES de Start-Process (compatible con PS 5.1)
$env:ENVIRONMENT       = "development"
$env:EXPECTED_DATABASE = "icaro_dev"
$env:DATABASE_URL      = "sqlite:///icaro_dev_dummy.sqlite3"
$env:SECRET_KEY        = "django-insecure-dev-key-do-not-use-in-prod"
$env:FIELD_ENCRYPTION_KEY = "dev-encryption-key"

$djangoProcess = Start-Process `
    -FilePath $PythonExe `
    -ArgumentList $ManagePy, "runserver", "8000", "--noreload" `
    -WorkingDirectory $BackendPath `
    -NoNewWindow `
    -PassThru

if (-not $djangoProcess) {
    Write-Host "[ERROR] No se pudo iniciar Django." -ForegroundColor Red
    Read-Host "Presione Enter para salir"
    exit 1
}

Write-Host "    Django PID: $($djangoProcess.Id)"

# ── [4/5] Health check: esperar que Django responda ────────────────────
Write-Host "[4/5] Esperando que Django responda (max 20s)..."
$maxWait  = 20
$elapsed  = 0
$djangoOk = $false

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds 1
    $elapsed++

    # Verificar que el proceso sigue vivo
    if ($djangoProcess.HasExited) {
        Write-Host "`n[ERROR] Django se cerro inesperadamente (codigo: $($djangoProcess.ExitCode))." -ForegroundColor Red
        Write-Host "        Verifica que las migraciones esten al dia: python manage.py migrate" -ForegroundColor Yellow
        Read-Host "Presione Enter para salir"
        exit 1
    }

    $check = Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue
    if ($check.TcpTestSucceeded) {
        $djangoOk = $true
        Write-Host "    Django listo en $elapsed segundo(s)." -ForegroundColor Green
        break
    }
    Write-Host "    Esperando... ($elapsed/$maxWait s)"
}

if (-not $djangoOk) {
    Write-Host "`n[ERROR] Django no respondio en $maxWait segundos." -ForegroundColor Red
    Stop-Process -Id $djangoProcess.Id -Force -ErrorAction SilentlyContinue
    Read-Host "Presione Enter para salir"
    exit 1
}

# ── [5/5] Levantar Frontend Expo en ventana separada ──────────────────
Write-Host "[5/5] Levantando Frontend Expo Web (puerto 19006)..."
$npxExe  = "npx"
$expoCmd = "Set-Location '$FrontendPath'; `$env:BROWSER='none'; npx expo start --web --port 19006"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $expoCmd

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "  Backend activo  →  http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend expo   →  http://localhost:19006" -ForegroundColor Green
Write-Host "==============================================`n" -ForegroundColor Green

Start-Sleep -Seconds 6
Start-Process "http://localhost:19006"

Write-Host "Presiona Ctrl+C para detener Django o cierra esta ventana.`n"

# Mantener Django vivo mientras la ventana este abierta
try {
    $djangoProcess.WaitForExit()
} catch {
    # Usuario cerro la ventana
}
