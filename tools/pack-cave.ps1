# Cuts the venue-cave pack (the CaveEnviro download) (assets-src, gitignored) into single sprites in apps/web/public/art/venues/cave.
# Pack: "Hand Drawn" cave environment by wigglesmith79 (itch.io). Run: powershell -File tools/pack-cave.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot
$ErrorActionPreference = 'Stop'
$src = Join-Path $root 'assets-src/venue-cave'
$out = Join-Path $root 'apps\web\public\art\venues\cave'
New-Item -ItemType Directory -Force $out | Out-Null
Copy-Item (Join-Path $src '_infinant rock background.png') (Join-Path $out 'rock.png') -Force

# crop (x, y, w, h in source pixels) -> trim to the opaque bounds -> scale to maxH -> save
function Cut($file, $name, $x, $y, $w, $h, $maxH) {
  $b = New-Object System.Drawing.Bitmap (Join-Path $src $file)
  $x1 = $b.Width; $y1 = $b.Height; $x0 = 0; $y0 = 0
  $minx = $x + $w; $miny = $y + $h; $maxx = $x; $maxy = $y
  for ($yy = $y; $yy -lt [math]::Min($y + $h, $b.Height); $yy += 2) {
    for ($xx = $x; $xx -lt [math]::Min($x + $w, $b.Width); $xx += 2) {
      if ($b.GetPixel($xx, $yy).A -gt 60) {
        if ($xx -lt $minx) { $minx = $xx }; if ($xx -gt $maxx) { $maxx = $xx }
        if ($yy -lt $miny) { $miny = $yy }; if ($yy -gt $maxy) { $maxy = $yy }
      }
    }
  }
  $r = New-Object System.Drawing.Rectangle $minx, $miny, ($maxx - $minx + 1), ($maxy - $miny + 1)
  $k = [math]::Min(1.0, $maxH / $r.Height)
  $ow = [int][math]::Round($r.Width * $k); $oh = [int][math]::Round($r.Height * $k)
  $o = New-Object System.Drawing.Bitmap $ow, $oh
  $g = [System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode = 'HighQualityBicubic'
  $g.DrawImage($b, (New-Object System.Drawing.Rectangle 0, 0, $ow, $oh), $r, 'Pixel'); $g.Dispose()
  $o.Save((Join-Path $out "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  "$name ${ow}x${oh}"
  $o.Dispose(); $b.Dispose()
}
$f = 1.023  # the sheets were measured on a 2000px-wide preview of the 2046px originals
function S($v) { [int][math]::Round($v * $f) }
$env = 'Rocks\CaveEnvironment.png'
Cut $env 'pillar1' (S 20) (S 760) (S 460) (S 840) 700
Cut $env 'pillar2' (S 540) (S 760) (S 380) (S 840) 700
Cut $env 'pillar3' (S 1110) (S 760) (S 500) (S 840) 700
Cut $env 'stal1' (S 1370) (S 480) (S 130) (S 240) 300
Cut $env 'stal2' (S 1520) (S 450) (S 160) (S 270) 300
Cut $env 'stal3' (S 1750) (S 440) (S 200) (S 290) 300
$m = 'Mushrooms\SporeFilledMushrooms1.png'
Cut $m 'mushBig' 225 420 360 510 420
Cut $m 'mushMid' 650 380 250 260 260
Cut $m 'mushCluster' 590 750 150 170 170
Cut $m 'mushSmall' 770 725 230 200 200
Cut $m 'mushTall' 95 215 220 200 200
Get-ChildItem $out | Select-Object Name, Length
