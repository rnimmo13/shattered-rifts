# Rebuilds apps/web/public/art/manifest.json from the PNGs in public/art/figures: figures/<id>.png is the real figure
# for enemy unit <id> (art key "unit:<id>"). Called by the pack-*.ps1 tools that write figures.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$dir = Join-Path $root 'apps/web/public/art/figures'
$figures = [ordered]@{}
foreach ($f in Get-ChildItem $dir -Filter *.png | Sort-Object Name) {
  $figures["unit:$($f.BaseName)"] = "figures/$($f.Name)"
}
$json = [ordered]@{ figures = $figures } | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText((Join-Path $root 'apps/web/public/art/manifest.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
"manifest: $($figures.Count) figures"
