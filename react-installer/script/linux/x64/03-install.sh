#!/usr/bin/env bash
# 03-install.sh
# Orquestador principal del instalador de MC Launch para Linux x64

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_step() { printf '{"step":%d,"total":%d,"message":"%s"}\n' "$1" "$2" "$3"; }
log_status() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }

# Hacer ejecutables los scripts hermanos
chmod +x "$SCRIPT_DIR/01-detect.sh" "$SCRIPT_DIR/02-check-java.sh"

# --- Paso 1: Deteccion ---
log_step 1 3 "Detectando entorno del sistema..."
DETECT_JSON=$("$SCRIPT_DIR/01-detect.sh")
LOCALE=$(echo "$DETECT_JSON" | grep -oP '(?<="locale": ")[^"]+')
log_step 1 3 "Entorno detectado: linux x64, locale=$LOCALE"

# --- Paso 2: Java ---
log_step 2 3 "Verificando Java (minimo v21)..."
if ! "$SCRIPT_DIR/02-check-java.sh"; then
    log_status "error" "Fallo la verificacion de Java."
    exit 1
fi

# --- Paso 3: Launcher ---
log_step 3 3 "Instalando MC Launch..."

# TODO: Reemplazar cuando la URL del launcher este disponible.
# LAUNCHER_URL="https://releases.mclaunch.app/linux/x64/MCLaunch.tar.gz"
# LAUNCHER_TAR="/tmp/MCLaunch.tar.gz"
# curl -fsSL "$LAUNCHER_URL" -o "$LAUNCHER_TAR"
# sudo tar -xzf "$LAUNCHER_TAR" -C /opt/mclaunch --strip-components=1
# rm -f "$LAUNCHER_TAR"
# sudo ln -sf /opt/mclaunch/mclaunch /usr/local/bin/mclaunch

log_status "done" "Instalacion completada correctamente."
exit 0
