# Cuts the monsters-herrero illustrations (assets-src, gitignored) into enemy figures in apps/web/public/art/figures and
# writes the figures part of apps/web/public/art/manifest.json (the game's real-art hook, see src/art/assets.ts).
# Art: "Monstrous Menagerie #1" by Tania Herrero (CC-BY-4.0, credited in CREDITS.md and the Credits page).
# Each figure is trimmed to its outline, flipped to face left when needed (enemies stand on the right), scaled to
# 640px tall and given a soft light rim so dark ink reads against dark stages.
# Run: powershell -File tools/pack-monsters.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$src = Join-Path $root 'assets-src/monsters-herrero'
$out = Join-Path $root 'apps/web/public/art/figures'
New-Item -ItemType Directory -Force $out | Out-Null

# file -> enemy id. flip = the drawing faces right and must be mirrored to face the hero on the left.
$monsters = @(
  @{ file = 'Dragon Tyrant.png'; id = 'vorthax'; flip = $false },
  @{ file = 'Baleful Cockatrice.png'; id = 'gorrmaw'; flip = $true },
  @{ file = 'Grandiose Lich.png'; id = 'nyxara'; flip = $false },
  @{ file = 'Ravenous Watcher.png'; id = 'whisperer'; flip = $false },
  @{ file = 'Goblin Marauder.png'; id = 'packmother-ruhn'; flip = $false },
  @{ file = 'Shrouded Beast.png'; id = 'feral-riftling'; flip = $true },
  @{ file = 'Deathcap Emmisary.png'; id = 'bloated-one'; flip = $false },
  @{ file = 'Antediluvian Leviathan.png'; id = 'choir-of-silence'; flip = $true }
)
$H = 640
$rim = [System.Drawing.Imaging.ColorMatrix]::new()
# every pixel becomes the rim colour (#b9a8ff) keeping 55% of its alpha
$rim.Matrix00 = 0; $rim.Matrix11 = 0; $rim.Matrix22 = 0; $rim.Matrix33 = 0.55
$rim.Matrix40 = 0.725; $rim.Matrix41 = 0.659; $rim.Matrix42 = 1.0
$tint = New-Object System.Drawing.Imaging.ImageAttributes
$tint.SetColorMatrix($rim)

$manifest = [ordered]@{}
foreach ($m in $monsters) {
  $b = New-Object System.Drawing.Bitmap (Join-Path $src $m.file)
  if ($m.flip) { $b.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
  # opaque bounds (sampled every 4px)
  $minx = $b.Width; $miny = $b.Height; $maxx = 0; $maxy = 0
  for ($y = 0; $y -lt $b.Height; $y += 4) { for ($x = 0; $x -lt $b.Width; $x += 4) {
    if ($b.GetPixel($x, $y).A -gt 40) {
      if ($x -lt $minx) { $minx = $x }; if ($x -gt $maxx) { $maxx = $x }
      if ($y -lt $miny) { $miny = $y }; if ($y -gt $maxy) { $maxy = $y }
    } } }
  $r = New-Object System.Drawing.Rectangle $minx, $miny, ($maxx - $minx + 1), ($maxy - $miny + 1)
  $k = $H / $r.Height
  $w = [int][math]::Round($r.Width * $k)
  $pad = 14
  $o = New-Object System.Drawing.Bitmap ($w + 2 * $pad), ($H + 2 * $pad)
  $g = [System.Drawing.Graphics]::FromImage($o)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $dest = New-Object System.Drawing.Rectangle $pad, $pad, $w, $H
  $draw = {
    param($dx, $dy, $attr)
    $d = New-Object System.Drawing.Rectangle ($pad + $dx), ($pad + $dy), $w, $H
    if ($attr) { $g.DrawImage($b, $d, $r.X, $r.Y, $r.Width, $r.Height, 'Pixel', $attr) } else { $g.DrawImage($b, $d, $r.X, $r.Y, $r.Width, $r.Height, 'Pixel') }
  }
  # soft rim: tinted copies around the outline, then the art on top
  foreach ($ring in @(@(7, 0.5), @(4, 1))) {
    $rad = $ring[0]
    for ($a = 0; $a -lt 360; $a += 30) {
      $dx = [int][math]::Round([math]::Cos($a * [math]::PI / 180) * $rad)
      $dy = [int][math]::Round([math]::Sin($a * [math]::PI / 180) * $rad)
      & $draw $dx $dy $tint
    }
  }
  & $draw 0 0 $null
  $g.Dispose()
  $o.Save((Join-Path $out "$($m.id).png"), [System.Drawing.Imaging.ImageFormat]::Png)
  "$($m.id) $($o.Width)x$($o.Height)"
  $manifest["unit:$($m.id)"] = "figures/$($m.id).png"
  $o.Dispose(); $b.Dispose()
}
$json = [ordered]@{ figures = $manifest } | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText((Join-Path $root 'apps/web/public/art/manifest.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
Get-ChildItem $out | Select-Object Name, Length
