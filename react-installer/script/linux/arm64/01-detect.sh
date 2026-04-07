#!/usr/bin/env bash
# 01-detect.sh
# Detecta el idioma del sistema y la arquitectura para Linux ARM64
# Output: JSON con informacion del entorno

set -euo pipefail

LOCALE="${LANG:-en_US.UTF-8}"
LANG_CODE="${LOCALE%%_*}"
ARCH="arm64"
OS_PRETTY=""
if [ -f /etc/os-release ]; then
    OS_PRETTY=$(grep '^PRETTY_NAME=' /etc/os-release | cut -d= -f2 | tr -d '"')
fi
IS_ROOT=false
[ "$(id -u)" -eq 0 ] && IS_ROOT=true

PKG_MANAGER="unknown"
for pm in apt dnf yum pacman zypper; do
    if command -v "$pm" &>/dev/null; then
        PKG_MANAGER="$pm"
        break
    fi
done

cat <<EOF
{
  "os": "linux",
  "arch": "$ARCH",
  "locale": "$LOCALE",
  "lang": "$LANG_CODE",
  "osVersion": "$OS_PRETTY",
  "kernel": "$(uname -r)",
  "isRoot": $IS_ROOT,
  "pkgManager": "$PKG_MANAGER",
  "user": "${USER:-$(whoami)}",
  "home": "$HOME"
}
EOF
