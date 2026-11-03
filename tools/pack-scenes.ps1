# Packs the painted event scenes: assets-src/events/<eventId>.png -> apps/web/public/art/events/<eventId>.jpg (1440 x 960).
# The event screen shows public/art/events/<scene>.jpg behind an event (its `scene` is the event's id), and merchant.jpg and
# shrine.jpg behind those stops. Prompts: docs/scene-prompts.md section 1.
# Run: powershell -File tools/pack-scenes.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$src = Join-Path $root 'assets-src/events'
$out = Join-Path $root 'apps/web/public/art/events'
New-Item -ItemType Directory -Force $out | Out-Null
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]80)
$W = 1440; $H = 960
$n = 0
foreach ($f in Get-ChildItem $src -Filter *.png | Sort-Object Name) {
  $b = New-Object System.Drawing.Bitmap $f.FullName
  # cover a 3:2 frame (the sources are 3:2 already; anything else is cropped about its centre)
  $k = [math]::Max($W / $b.Width, $H / $b.Height)
  $dw = $b.Width * $k; $dh = $b.Height * $k
  $o = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($o)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($b, ($W - $dw) / 2, ($H - $dh) / 2, $dw, $dh)
  $g.Dispose()
  $o.Save((Join-Path $out "$($f.BaseName).jpg"), $enc, $ep)
  $o.Dispose(); $b.Dispose()
  $n++
}
"scenes: $n"
