# Packs the fx-magic-effects strips (assets-src, gitignored) into small grid sheets + fx.json in apps/web/public/art/fx.
# Effects: Free Magic Effects by SovDigital (see CREDITS.md). Run: powershell -File tools/pack-fx.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot
$ErrorActionPreference = 'Stop'
$src = Join-Path $root 'assets-src/fx-magic-effects/effects'
$out = Join-Path $root 'apps\web\public\art\fx'
New-Item -ItemType Directory -Force $out | Out-Null
$jobs = @(
  @{ name = 'fire_strike'; id = 'fire'; scale = 0.55 },
  @{ name = 'frost_explosion_medium'; id = 'frost'; scale = 0.8 },
  @{ name = 'portal_arcane_open'; id = 'portalOpen'; scale = 0.8 },
  @{ name = 'portal_arcane_close'; id = 'portalClose'; scale = 0.8 }
)
$cols = 6
$manifest = [ordered]@{}
foreach ($j in $jobs) {
  $meta = (Get-Content (Join-Path $src "$($j.name)\$($j.name).json") -Raw | ConvertFrom-Json).clips.effect
  $fw = [int]$meta.frame_size[0]; $fh = [int]$meta.frame_size[1]; $n = [int]$meta.frames
  $w = [int][math]::Round($fw * $j.scale); $h = [int][math]::Round($fh * $j.scale)
  $rows = [int][math]::Ceiling($n / $cols)
  $strip = New-Object System.Drawing.Bitmap (Join-Path $src "$($j.name)\effect.png")
  $sheet = New-Object System.Drawing.Bitmap ($w * $cols), ($h * $rows)
  $g = [System.Drawing.Graphics]::FromImage($sheet)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.CompositingMode = 'SourceCopy'
  for ($i = 0; $i -lt $n; $i++) {
    $dest = New-Object System.Drawing.Rectangle (($i % $cols) * $w), ([math]::Floor($i / $cols) * $h), $w, $h
    $from = New-Object System.Drawing.Rectangle ($i * $fw), 0, $fw, $fh
    $g.DrawImage($strip, $dest, $from, 'Pixel')
  }
  $g.Dispose()
  $sheet.Save((Join-Path $out "$($j.id).png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $sheet.Dispose(); $strip.Dispose()
  $hit = if ($null -ne $meta.hit_frame) { [int]$meta.hit_frame } else { -1 }
  $manifest[$j.id] = [ordered]@{
    file = "$($j.id).png"; w = $w; h = $h; frames = $n; cols = $cols; fps = [int]$meta.fps
    px = [math]::Round($meta.pivot[0] * $j.scale, 1); py = [math]::Round($meta.pivot[1] * $j.scale, 1); hit = $hit
  }
}
[System.IO.File]::WriteAllText((Join-Path $out 'fx.json'), ($manifest | ConvertTo-Json -Depth 4), (New-Object System.Text.UTF8Encoding($false)))
Get-ChildItem $out | Select-Object Name, Length
