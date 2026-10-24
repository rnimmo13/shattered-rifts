# Cuts AI card-art sheets (3 x 3 pictures on a dark navy background) into one picture per card.
#   assets-src/cards/<sheet>.png     e.g. maren-01.png; which card is in which cell is in docs/card-art/sheets.json
#   -> apps/web/public/art/cards/<cardId>.jpg (768 x 576) and the manifest (upgrades share their base card's art)
# The cells are found from the navy gutters between the pictures; if the gutters can not be found the sheet is cut into
# equal cells with a small inset. Sheets that are not in assets-src/cards yet are skipped, and those cards keep their
# painted placeholder. Run: powershell -File tools/pack-cards.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$srcDir = Join-Path $root 'assets-src/cards'
$outDir = Join-Path $root 'apps/web/public/art/cards'
New-Item -ItemType Directory -Force $outDir | Out-Null

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public static class Panels {
  // Runs of non-gutter lines along one axis. frac[i] = share of line i that is background-coloured.
  static List<int[]> Runs(double[] frac, double gutter, int minLen) {
    var runs = new List<int[]>(); int start = -1;
    for (int i = 0; i <= frac.Length; i++) {
      bool art = i < frac.Length && frac[i] < gutter;
      if (art && start < 0) start = i;
      if (!art && start >= 0) { if (i - start >= minLen) runs.Add(new int[] { start, i }); start = -1; }
    }
    return runs;
  }
  // Returns cols*rows rectangles (x0, y0, x1, y1) in reading order, or null when the gutters do not give that grid.
  public static List<int[]> Find(Bitmap b, int cols, int rows) {
    int w = b.Width, h = b.Height;
    BitmapData d = b.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    byte[] px = new byte[d.Stride * h];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length); int stride = d.Stride; b.UnlockBits(d);
    int br = px[2 + 4 * 2 + stride * 2], bg = px[1 + 4 * 2 + stride * 2], bb = px[0 + 4 * 2 + stride * 2];
    Func<int,int,bool> isBg = (x, y) => { int i = y * stride + x * 4; return Math.Abs(px[i+2]-br) + Math.Abs(px[i+1]-bg) + Math.Abs(px[i]-bb) < 40; };
    double[] rf = new double[h];
    for (int y = 0; y < h; y++) { int n = 0; for (int x = 0; x < w; x += 2) if (isBg(x, y)) n++; rf[y] = n / (w / 2.0); }
    var rr = Runs(rf, 0.9, h / 20);
    if (rr.Count != rows) return null;
    var res = new List<int[]>();
    foreach (var band in rr) {
      double[] cf = new double[w];
      for (int x = 0; x < w; x++) { int n = 0, t = 0; for (int y = band[0]; y < band[1]; y += 2) { t++; if (isBg(x, y)) n++; } cf[x] = t == 0 ? 1 : n / (double)t; }
      var cr = Runs(cf, 0.9, w / 20);
      if (cr.Count != cols) return null;
      foreach (var c in cr) res.Add(new int[] { c[0], band[0], c[1], band[1] });
    }
    return res;
  }
}
"@ -ReferencedAssemblies System.Drawing

function Save-Jpeg($bmp, $path, $q) {
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$q)
  $bmp.Save($path, $enc, $ep)
}

$sheets = Get-Content (Join-Path $root 'docs/card-art/sheets.json') -Raw | ConvertFrom-Json
$done = 0
foreach ($sh in $sheets) {
  $path = Join-Path $srcDir "$($sh.name).png"
  if (-not (Test-Path $path)) { continue }
  $img = New-Object System.Drawing.Bitmap $path
  $cells = [Panels]::Find($img, $sh.cols, $sh.rows)
  $mode = 'gutters'
  if ($null -eq $cells) {
    $mode = 'equal cells'
    Write-Warning "$($sh.name): could not find the gutters; cutting equal cells (check the result)"
    $cells = New-Object System.Collections.ArrayList
    $cw = $img.Width / $sh.cols; $ch = $img.Height / $sh.rows
    for ($r = 0; $r -lt $sh.rows; $r++) { for ($c = 0; $c -lt $sh.cols; $c++) { [void]$cells.Add(@([int]($c * $cw), [int]($r * $ch), [int](($c + 1) * $cw), [int](($r + 1) * $ch))) } }
  }
  for ($i = 0; $i -lt $sh.ids.Count; $i++) {
    $cell = $cells[$i]
    # the pictures sit a little inside their cells, so an equal-cell cut needs a wider inset than a gutter cut
    $inset = if ($mode -eq 'gutters') { 4 } else { [int](($cell[2] - $cell[0]) * 0.035) }
    $sx = $cell[0] + $inset; $sy = $cell[1] + $inset; $sw = $cell[2] - $cell[0] - 2 * $inset; $sh2 = $cell[3] - $cell[1] - 2 * $inset
    # crop to 4:3 around the middle if the picture is not exactly that shape
    $want = 4.0 / 3.0
    if ($sw / $sh2 -gt $want) { $nw = [int]($sh2 * $want); $sx += [int](($sw - $nw) / 2); $sw = $nw }
    else { $nh = [int]($sw / $want); $sy += [int](($sh2 - $nh) / 2); $sh2 = $nh }
    $out = New-Object System.Drawing.Bitmap 768, 576
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, 768, 576), (New-Object System.Drawing.Rectangle $sx, $sy, $sw, $sh2), 'Pixel')
    $g.Dispose()
    Save-Jpeg $out (Join-Path $outDir "$($sh.ids[$i]).jpg") 88
    $out.Dispose(); $done++
  }
  "$($sh.name): $($sh.ids.Count) cards ($mode)"
  $img.Dispose()
}
"$done card pictures"
& (Join-Path $PSScriptRoot 'pack-manifest.ps1')
