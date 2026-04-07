#!/usr/bin/env bash
# 02-check-java.sh
# Verifica si Java >= 21 esta instalado. Si no, descarga e instala Temurin 21 (macOS ARM64).
# Output: JSON con el resultado de cada paso

set -euo pipefail

MIN_JAVA=21
JAVA_URL="https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jdk/hotspot/normal/eclipse"
TEMP_PKG="/tmp/temurin-21-macos-arm64.pkg"

log() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }

get_java_major() {
    local java_bin="java"
    if /usr/libexec/java_home &>/dev/null 2>&1; then
        java_bin="$(/usr/libexec/java_home)/bin/java"
    fi

    if command -v "$java_bin" &>/dev/null 2>&1 || [ -x "$java_bin" ]; then
        local raw
        raw=$("$java_bin" -version 2>&1 | head -1)
        local ver
        ver=$(echo "$raw" | grep -oE '"[0-9]+' | tr -d '"' | head -1)
        if [ "$ver" = "1" ]; then
            ver=$(echo "$raw" | grep -oE '"1\.[0-9]+' | grep -oE '\.[0-9]+' | tr -d '.' | head -1)
        fi
        echo "${ver:-0}"
    else
        echo "0"
    fi
}

CURRENT=$(get_java_major)

if [ "$CURRENT" -ge "$MIN_JAVA" ] 2>/dev/null; then
    log "ok" "Java $CURRENT detectado. Version valida (minimo $MIN_JAVA)."
    exit 0
fi

if [ "$CURRENT" -gt 0 ] 2>/dev/null; then
    log "outdated" "Java $CURRENT detectado. Actualizando a Java 21 LTS..."
else
    log "missing" "Java no encontrado. Instalando Java 21 LTS (Temurin ARM64)..."
fi

# --- Intentar via Homebrew (nativo ARM64) ---
if command -v brew &>/dev/null; then
    log "installing" "Instalando via Homebrew (nativo ARM64)..."
    brew install --cask temurin@21 2>/dev/null || brew install temurin 2>/dev/null || true
    INSTALLED=$(get_java_major)
    if [ "$INSTALLED" -ge "$MIN_JAVA" ] 2>/dev/null; then
        log "done" "Java $INSTALLED instalado correctamente via Homebrew."
        exit 0
    fi
fi

# --- Fallback: descarga .pkg ARM64 ---
log "downloading" "Descargando Eclipse Temurin 21 .pkg para macOS ARM64..."
if command -v curl &>/dev/null; then
    curl -fsSL "$JAVA_URL" -o "$TEMP_PKG"
else
    log "error" "curl no esta disponible."
    exit 1
fi

log "installing" "Instalando el paquete .pkg..."
sudo installer -pkg "$TEMP_PKG" -target /
rm -f "$TEMP_PKG"

INSTALLED=$(get_java_major)
if [ "$INSTALLED" -ge "$MIN_JAVA" ] 2>/dev/null; then
    log "done" "Java $INSTALLED instalado correctamente."
    exit 0
else
    log "error" "La instalacion finalizo pero Java no fue detectado. Reinicia el instalador."
    exit 1
fi
