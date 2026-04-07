#!/usr/bin/env bash
# 02-check-java.sh
# Verifica si Java >= 21 esta instalado. Si no, descarga e instala Temurin 21 (ARM64).
# Output: JSON con el resultado de cada paso

set -euo pipefail

MIN_JAVA=21
JAVA_URL="https://api.adoptium.net/v3/binary/latest/21/ga/linux/aarch64/jdk/hotspot/normal/eclipse"
INSTALL_DIR="/opt/temurin-21"
TEMP_TAR="/tmp/temurin-21-linux-arm64.tar.gz"

log() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }

get_java_major() {
    if command -v java &>/dev/null; then
        local raw
        raw=$(java -version 2>&1 | head -1)
        local ver
        ver=$(echo "$raw" | grep -oP '(?<=")\d+' | head -1)
        if [ "$ver" = "1" ]; then
            ver=$(echo "$raw" | grep -oP '(?<="1\.)\d+' | head -1)
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
    log "missing" "Java no encontrado. Descargando Java 21 LTS (Temurin ARM64)..."
fi

install_via_pkg_manager() {
    if command -v apt &>/dev/null; then
        log "installing" "Instalando via apt..."
        sudo apt-get update -qq
        sudo apt-get install -y temurin-21-jdk 2>/dev/null || \
            sudo apt-get install -y openjdk-21-jdk 2>/dev/null || return 1
        return 0
    elif command -v dnf &>/dev/null; then
        log "installing" "Instalando via dnf..."
        sudo dnf install -y java-21-openjdk-devel 2>/dev/null || return 1
        return 0
    elif command -v pacman &>/dev/null; then
        log "installing" "Instalando via pacman..."
        sudo pacman -Sy --noconfirm jdk21-openjdk 2>/dev/null || return 1
        return 0
    fi
    return 1
}

if install_via_pkg_manager; then
    INSTALLED=$(get_java_major)
    if [ "$INSTALLED" -ge "$MIN_JAVA" ] 2>/dev/null; then
        log "done" "Java $INSTALLED instalado correctamente via gestor de paquetes."
        exit 0
    fi
fi

log "downloading" "Descargando Eclipse Temurin 21 para Linux ARM64..."
if command -v curl &>/dev/null; then
    curl -fsSL "$JAVA_URL" -o "$TEMP_TAR"
elif command -v wget &>/dev/null; then
    wget -q "$JAVA_URL" -O "$TEMP_TAR"
else
    log "error" "curl ni wget estan disponibles."
    exit 1
fi

log "installing" "Extrayendo Java 21 en $INSTALL_DIR..."
sudo mkdir -p "$INSTALL_DIR"
sudo tar -xzf "$TEMP_TAR" -C "$INSTALL_DIR" --strip-components=1
rm -f "$TEMP_TAR"

PROFILE_LINE="export PATH=\"$INSTALL_DIR/bin:\$PATH\""
if ! grep -qF "$INSTALL_DIR" /etc/profile.d/temurin.sh 2>/dev/null; then
    echo "$PROFILE_LINE" | sudo tee /etc/profile.d/temurin.sh > /dev/null
fi
export PATH="$INSTALL_DIR/bin:$PATH"

INSTALLED=$(get_java_major)
if [ "$INSTALLED" -ge "$MIN_JAVA" ] 2>/dev/null; then
    log "done" "Java $INSTALLED instalado correctamente en $INSTALL_DIR."
    exit 0
else
    log "error" "La instalacion finalizo pero Java no fue detectado. Reinicia el instalador."
    exit 1
fi
