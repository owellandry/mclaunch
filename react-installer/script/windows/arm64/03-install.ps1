# 03-install.ps1
# Orquestador principal del instalador de Slaumcher para Windows ARM64

$ErrorActionPreference = "Stop"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Step($step, $total, $message) {
    Write-Output ([ordered]@{ step = $step; total = $total; message = $message } | ConvertTo-Json -Compress)
}

function Write-Status($status, $message) {
    Write-Output ([ordered]@{ status = $status; message = $message } | ConvertTo-Json -Compress)
}

Write-Step 1 3 "Detectando entorno del sistema..."
try {
    $detectResult = & "$SCRIPT_DIR\01-detect.ps1" | ConvertFrom-Json
    Write-Step 1 3 "Entorno detectado: $($detectResult.os) $($detectResult.arch), locale=$($detectResult.locale)"
} catch {
    Write-Status "error" "Fallo la deteccion del entorno: $($_.Exception.Message)"
    exit 1
}

Write-Step 2 3 "Verificando Java (minimo v21)..."
try {
    & "$SCRIPT_DIR\02-check-java.ps1"
    if ($LASTEXITCODE -ne 0) { throw "check-java salio con codigo $LASTEXITCODE" }
} catch {
    Write-Status "error" "Fallo la verificacion de Java: $($_.Exception.Message)"
    exit 1
}

Write-Step 3 3 "Instalando Slaumcher..."

# TODO: Reemplazar cuando la URL del launcher este disponible.
# $LAUNCHER_URL = "https://slaumcher.net/downloads/windows/arm64/Slaumcher-Setup.exe"
# $LAUNCHER_EXE = Join-Path $env:TEMP "Slaumcher-Setup.exe"
# Invoke-WebRequest -Uri $LAUNCHER_URL -OutFile $LAUNCHER_EXE -UseBasicParsing
# Start-Process $LAUNCHER_EXE -ArgumentList "/S" -Wait -NoNewWindow
# Remove-Item $LAUNCHER_EXE -Force -ErrorAction SilentlyContinue

Write-Status "done" "Instalacion completada correctamente."
exit 0
