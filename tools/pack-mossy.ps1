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

# rim colour matrix: a soft light outline so dark figures read on dark stages
$rim = [System.Drawing.Imaging.ColorMatrix]::new()
$rim.Matrix00 = 0; $rim.Matrix11 = 0; $rim.Matrix22 = 0; $rim.Matrix33 = 0.5
$rim.Matrix40 = 0.725; $rim.Matrix41 = 0.659; $rim.Matrix42 = 1.0
$tint = New-Object System.Drawing.Imaging.ImageAttributes
$tint.SetColorMatrix($rim)

# crop (x,y,w,h; w=0 means the whole image) -> trim to opaque bounds -> scale to height outH -> optional rim -> save
function Cut($file, $dest, $x, $y, $w, $h, $outH, $withRim) {
  $b = New-Object System.Drawing.Bitmap (Join-Path $src $file)
  if ($w -eq 0) { $x = 0; $y = 0; $w = $b.Width; $h = $b.Height }
  $minx = $x + $w; $miny = $y + $h; $maxx = $x; $maxy = $y
  for ($yy = $y; $yy -lt [math]::Min($y + $h, $b.Height); $yy += 2) {
    for ($xx = $x; $xx -lt [math]::Min($x + $w, $b.Width); $xx += 2) {
      if ($b.GetPixel($xx, $yy).A -gt 40) {
        if ($xx -lt $minx) { $minx = $xx }; if ($xx -gt $maxx) { $maxx = $xx }
        if ($yy -lt $miny) { $miny = $yy }; if ($yy -gt $maxy) { $maxy = $yy }
      }
    }
  }
  $r = New-Object System.Drawing.Rectangle $minx, $miny, ($maxx - $minx + 1), ($maxy - $miny + 1)
  $k = [math]::Min(1.0, $outH / $r.Height)
  $ow = [int][math]::Round($r.Width * $k); $oh = [int][math]::Round($r.Height * $k)
  $pad = if ($withRim) { 14 } else { 0 }
  $o = New-Object System.Drawing.Bitmap ($ow + 2 * $pad), ($oh + 2 * $pad)
  $g = [System.Drawing.Graphics]::FromImage($o)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  if ($withRim) {
    foreach ($ring in @(@(7, 0.5), @(4, 1))) {
      for ($a = 0; $a -lt 360; $a += 30) {
        $dx = [int][math]::Round([math]::Cos($a * [math]::PI / 180) * $ring[0])
        $dy = [int][math]::Round([math]::Sin($a * [math]::PI / 180) * $ring[0])
        $d = New-Object System.Drawing.Rectangle ($pad + $dx), ($pad + $dy), $ow, $oh
        $g.DrawImage($b, $d, $r.X, $r.Y, $r.Width, $r.Height, 'Pixel', $tint)
      }
    }
  }
  $d = New-Object System.Drawing.Rectangle $pad, $pad, $ow, $oh
  $g.DrawImage($b, $d, $r.X, $r.Y, $r.Width, $r.Height, 'Pixel')
  $g.Dispose()
  $o.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  "$(Split-Path $dest -Leaf) $($o.Width)x$($o.Height)"
  $o.Dispose(); $b.Dispose()
}

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
