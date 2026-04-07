# 02-check-java.ps1
# Verifica si Java >= 21 esta instalado. Si no, descarga e instala Temurin 21 (x64).
# Output: JSON con el resultado de cada paso

$ErrorActionPreference = "Stop"
$MIN_JAVA  = 21
$JAVA_URL  = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse"
$TEMP_MSI  = Join-Path $env:TEMP "temurin-21-windows-x64.msi"

function Write-Status($status, $message, $extra = @{}) {
    $obj = [ordered]@{ status = $status; message = $message }
    foreach ($k in $extra.Keys) { $obj[$k] = $extra[$k] }
    Write-Output ($obj | ConvertTo-Json -Compress)
}

function Get-JavaMajorVersion {
    try {
        $raw = & java -version 2>&1 | Select-Object -First 1
        if ($raw -match '"(\d+)(?:\.(\d+)\.(\d+))?') {
            $major = [int]$Matches[1]
            # Esquema antiguo: 1.8 -> 8
            if ($major -eq 1 -and $Matches[2]) { $major = [int]$Matches[2] }
            return $major
        }
    } catch { }
    return 0
}

# --- Verificacion inicial ---
$current = Get-JavaMajorVersion

if ($current -ge $MIN_JAVA) {
    Write-Status "ok" "Java $current detectado. Version valida (minimo $MIN_JAVA)." @{ version = $current }
    exit 0
}

if ($current -gt 0) {
    Write-Status "outdated" "Java $current detectado. Version inferior al minimo requerido ($MIN_JAVA). Actualizando..." @{ version = $current }
} else {
    Write-Status "missing" "Java no encontrado. Descargando Java 21 LTS (Temurin x64)..."
}

# --- Descarga ---
try {
    Write-Status "downloading" "Descargando Eclipse Temurin 21 para Windows x64..."
    $progressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $JAVA_URL -OutFile $TEMP_MSI -UseBasicParsing
} catch {
    Write-Status "error" "Fallo la descarga: $($_.Exception.Message)"
    exit 1
}

# --- Instalacion silenciosa ---
try {
    Write-Status "installing" "Instalando Java 21 en silencio..."
    $args = @(
        "/i", "`"$TEMP_MSI`"",
        "/quiet", "/norestart",
        "ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome"
    )
    $proc = Start-Process msiexec.exe -ArgumentList $args -Wait -PassThru -NoNewWindow
    if ($proc.ExitCode -ne 0) { throw "msiexec termino con codigo $($proc.ExitCode)" }
} catch {
    Write-Status "error" "Fallo la instalacion: $($_.Exception.Message)"
    Remove-Item $TEMP_MSI -Force -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $TEMP_MSI -Force -ErrorAction SilentlyContinue

# --- Refrescar PATH y verificar ---
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

$installed = Get-JavaMajorVersion
if ($installed -ge $MIN_JAVA) {
    Write-Status "done" "Java $installed instalado correctamente." @{ version = $installed }
    exit 0
} else {
    Write-Status "error" "La instalacion finalizo pero Java no fue detectado. Reinicia el instalador."
    exit 1
}
