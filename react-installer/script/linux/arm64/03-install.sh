#!/usr/bin/env bash
# 03-install.sh
# Orquestador principal del instalador de Slaumcher para Linux ARM64

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_step() { printf '{"step":%d,"total":%d,"message":"%s"}\n' "$1" "$2" "$3"; }
log_status() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }

chmod +x "$SCRIPT_DIR/01-detect.sh" "$SCRIPT_DIR/02-check-java.sh"

log_step 1 3 "Detectando entorno del sistema..."
DETECT_JSON=$("$SCRIPT_DIR/01-detect.sh")
LOCALE=$(echo "$DETECT_JSON" | grep -oP '(?<="locale": ")[^"]+')
log_step 1 3 "Entorno detectado: linux arm64, locale=$LOCALE"

log_step 2 3 "Verificando Java (minimo v21)..."
if ! "$SCRIPT_DIR/02-check-java.sh"; then
    log_status "error" "Fallo la verificacion de Java."
    exit 1
fi

log_step 3 3 "Instalando Slaumcher..."

# TODO: Reemplazar cuando la URL del launcher este disponible.
# LAUNCHER_URL="https://slaumcher.net/downloads/linux/arm64/Slaumcher.tar.gz"
# LAUNCHER_TAR="/tmp/Slaumcher.tar.gz"
# curl -fsSL "$LAUNCHER_URL" -o "$LAUNCHER_TAR"
# sudo tar -xzf "$LAUNCHER_TAR" -C /opt/slaumcher --strip-components=1
# rm -f "$LAUNCHER_TAR"
# sudo ln -sf /opt/slaumcher/slaumcher /usr/local/bin/slaumcher

log_status "done" "Instalacion completada correctamente."
exit 0
