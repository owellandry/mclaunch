#!/usr/bin/env bash
# 01-detect.sh
# Detecta el idioma del sistema y la arquitectura para macOS x64 (Intel)
# Output: JSON con informacion del entorno

set -euo pipefail

LOCALE=$(defaults read -g AppleLocale 2>/dev/null || echo "${LANG:-en_US}")
LANG_CODE="${LOCALE%%_*}"
ARCH="x64"
OS_VERSION=$(sw_vers -productVersion 2>/dev/null || echo "unknown")
OS_NAME=$(sw_vers -productName 2>/dev/null || echo "macOS")
IS_ROOT=false
[ "$(id -u)" -eq 0 ] && IS_ROOT=true

# Detectar si Homebrew esta disponible
HAS_BREW=false
command -v brew &>/dev/null && HAS_BREW=true

cat <<EOF
{
  "os": "macos",
  "arch": "$ARCH",
  "locale": "$LOCALE",
  "lang": "$LANG_CODE",
  "osVersion": "$OS_NAME $OS_VERSION",
  "isRoot": $IS_ROOT,
  "hasBrew": $HAS_BREW,
  "user": "${USER:-$(whoami)}",
  "home": "$HOME"
}
EOF
