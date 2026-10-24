# Cuts the venue-mossy-cavern pack (assets-src, gitignored) into: three enemy figures (public/art/figures) and foliage
# props for the cave and swamp stages (public/art/venues/moss). Then refreshes manifest.json.
# Art: "Mossy Cavern" by Maaot (https://maaot.itch.io/mossy-cavern), credited in CREDITS.md and the Credits page.
# Run: powershell -File tools/pack-mossy.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$src = Join-Path $root 'assets-src/venue-mossy-cavern'
$figures = Join-Path $root 'apps/web/public/art/figures'
$moss = Join-Path $root 'apps/web/public/art/venues/moss'
New-Item -ItemType Directory -Force $figures, $moss | Out-Null

. (Join-Path $PSScriptRoot 'pack-lib.ps1')

# enemy figures: a green slime for the Spitter, an orange one for the Maw Spawn, the little wizard for the Hooded Acolyte
Cut 'Slimes/SlimeGreen/SlimeBasic_00000.png' (Join-Path $figures 'acid-spitter.png') 0 0 0 0 420 $true
Cut 'Slimes/SlimeOrange/SlimeOrange_00000.png' (Join-Path $figures 'maw-spawn.png') 0 0 0 0 420 $true
Cut 'BlueWizard Animations/BlueWizard/2BlueWizardIdle/Chara - BlueIdle00000.png' (Join-Path $figures 'hooded-acolyte.png') 0 0 0 0 520 $true

# foliage props (hanging fronds and moss from the tileset sheet, floor plants from the animation frames)
$hp = 'Mossy Assets/Mossy Tileset/Mossy - Hanging Plants.png'
Cut $hp (Join-Path $moss 'hang1.png') 100 100 400 1220 420 $false
Cut $hp (Join-Path $moss 'hang2.png') 540 100 400 1100 380 $false
Cut $hp (Join-Path $moss 'hangMoss.png') 70 1380 500 1400 460 $false
Cut $hp (Join-Path $moss 'leaf.png') 1170 1110 830 540 220 $false
$pa = 'Plant Animations/Plant Animations'
Cut "$pa/Plant 1/Plant1_00000.png" (Join-Path $moss 'plantA.png') 0 0 0 0 300 $false
Cut "$pa/Plant 2/Plant2_00000.png" (Join-Path $moss 'plantB.png') 0 0 0 0 300 $false
Cut "$pa/BlueFlower1/BlueFlower_00000.png" (Join-Path $moss 'flower.png') 0 0 0 0 260 $false

& (Join-Path $PSScriptRoot 'pack-manifest.ps1')
