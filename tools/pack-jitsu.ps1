# Cuts the one monster we use from assets-src/jitsu-koan-assets into an enemy figure and refreshes manifest.json.
# Art: waechter-20 (credit: TheRealFusion; free to use and edit, commercial allowed), from the Jitsu-Koan collection.
# Run: powershell -File tools/pack-jitsu.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$src = Join-Path $root 'assets-src/jitsu-koan-assets'
$figures = Join-Path $root 'apps/web/public/art/figures'
New-Item -ItemType Directory -Force $figures | Out-Null
. (Join-Path $PSScriptRoot 'pack-lib.ps1')
Cut 'waechter-20/waechter-20/waechter-20 Picture.png' (Join-Path $figures 'ghostwire.png') 0 0 0 0 520 $true
& (Join-Path $PSScriptRoot 'pack-manifest.ps1')
