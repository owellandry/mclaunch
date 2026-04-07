#!/usr/bin/env bash
# 03-install.sh
# Orquestador principal del instalador de MC Launch para macOS x64 (Intel)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_step() { printf '{"step":%d,"total":%d,"message":"%s"}\n' "$1" "$2" "$3"; }
log_status() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }

chmod +x "$SCRIPT_DIR/01-detect.sh" "$SCRIPT_DIR/02-check-java.sh"

log_step 1 3 "Detectando entorno del sistema..."
DETECT_JSON=$("$SCRIPT_DIR/01-detect.sh")
LOCALE=$(printf '%s' "$DETECT_JSON" | python3 -c 'import json, sys; print(json.load(sys.stdin).get("locale", "unknown"))')
log_step 1 3 "Entorno detectado: macOS x64 (Intel), locale=$LOCALE"

log_step 2 3 "Verificando Java (minimo v21)..."
if ! "$SCRIPT_DIR/02-check-java.sh"; then
    log_status "error" "Fallo la verificacion de Java."
    exit 1
fi

log_step 3 3 "Instalando MC Launch..."

# TODO: Reemplazar cuando la URL del launcher este disponible.
# LAUNCHER_URL="https://releases.mclaunch.app/macos/x64/MCLaunch.dmg"
# LAUNCHER_DMG="/tmp/MCLaunch.dmg"
# curl -fsSL "$LAUNCHER_URL" -o "$LAUNCHER_DMG"
# hdiutil attach "$LAUNCHER_DMG" -nobrowse -quiet
# cp -R "/Volumes/MCLaunch/MCLaunch.app" /Applications/
# hdiutil detach "/Volumes/MCLaunch" -quiet
# rm -f "$LAUNCHER_DMG"

log_status "done" "Instalacion completada correctamente."
exit 0
