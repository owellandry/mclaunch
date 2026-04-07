# 01-detect.ps1
# Detecta el idioma del sistema y la arquitectura para Windows ARM64
# Output: JSON con informacion del entorno

$ErrorActionPreference = "Stop"

$locale  = (Get-UICulture).Name
$lang    = $locale.Split('-')[0]
$osInfo  = Get-CimInstance Win32_OperatingSystem
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
             [Security.Principal.WindowsBuiltInRole]::Administrator)

$result = [ordered]@{
    os        = "windows"
    arch      = "arm64"
    locale    = $locale
    lang      = $lang
    osVersion = $osInfo.Caption.Trim()
    osBuild   = $osInfo.BuildNumber
    isAdmin   = $isAdmin
    user      = $env:USERNAME
    tempDir   = $env:TEMP
}

Write-Output ($result | ConvertTo-Json)
