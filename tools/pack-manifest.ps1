# Rebuilds apps/web/public/art/manifest.json from the PNGs in public/art/figures: figures/<id>.png is the real figure
# for enemy unit <id> (art key "unit:<id>"), figures/hero-<id>.png for a Riftwalker (art key "hero:<id>"), and figures/skins/<heroId>-<skin>.png an
# alternate look for the Store ("skins": skin id -> file, DECISIONS #402). Called by the pack-*.ps1 tools that write figures.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$dir = Join-Path $root 'apps/web/public/art/figures'
$figures = [ordered]@{}
foreach ($f in Get-ChildItem $dir -Filter *.png | Sort-Object Name) {
  # hero-<id>.png is a Riftwalker figure (art key hero:<id>); anything else is an enemy unit (unit:<id>)
  $key = if ($f.BaseName -like 'hero-*') { "hero:" + $f.BaseName.Substring(5) } else { "unit:$($f.BaseName)" }
  $figures[$key] = "figures/$($f.Name)"
}
# cards/<cardId>.jpg is a card's art window (written by pack-cards.ps1); upgrades share their base card's art in the game
$cards = [ordered]@{}
$cardDir = Join-Path $root 'apps/web/public/art/cards'
if (Test-Path $cardDir) { foreach ($f in Get-ChildItem $cardDir -Include *.jpg, *.png, *.webp -Recurse | Sort-Object Name) { $cards[$f.BaseName] = "cards/$($f.Name)" } }
$skins = [ordered]@{}
$skinDir = Join-Path $dir 'skins'
if (Test-Path $skinDir) { foreach ($f in Get-ChildItem $skinDir -Filter *.png | Sort-Object Name) { $skins[$f.BaseName] = "figures/skins/$($f.Name)" } }
$manifest = [ordered]@{ figures = $figures }
if ($skins.Count -gt 0) { $manifest['skins'] = $skins }
if ($cards.Count -gt 0) { $manifest['cards'] = $cards }
$json = $manifest | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText((Join-Path $root 'apps/web/public/art/manifest.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
"manifest: $($figures.Count) figures, $($skins.Count) skins, $($cards.Count) cards"
