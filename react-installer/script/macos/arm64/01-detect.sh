#!/usr/bin/env bash
# 01-detect.sh
# Detecta el idioma del sistema y la arquitectura para macOS ARM64 (Apple Silicon)
# Output: JSON con informacion del entorno

set -euo pipefail

LOCALE=$(defaults read -g AppleLocale 2>/dev/null || echo "${LANG:-en_US}")
LANG_CODE="${LOCALE%%_*}"
ARCH="arm64"
OS_VERSION=$(sw_vers -productVersion 2>/dev/null || echo "unknown")
OS_NAME=$(sw_vers -productName 2>/dev/null || echo "macOS")
IS_ROOT=false
[ "$(id -u)" -eq 0 ] && IS_ROOT=true

HAS_BREW=false
command -v brew &>/dev/null && HAS_BREW=true

# Verificar si Rosetta 2 esta disponible (para binarios x64)
HAS_ROSETTA=false
/usr/bin/arch -x86_64 /usr/bin/true &>/dev/null 2>&1 && HAS_ROSETTA=true

cat <<EOF
{
  "os": "macos",
  "arch": "$ARCH",
  "locale": "$LOCALE",
  "lang": "$LANG_CODE",
  "osVersion": "$OS_NAME $OS_VERSION",
  "isRoot": $IS_ROOT,
  "hasBrew": $HAS_BREW,
  "hasRosetta": $HAS_ROSETTA,
  "user": "${USER:-$(whoami)}",
  "home": "$HOME"
}
EOF
