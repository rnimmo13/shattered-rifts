# Cuts the nine Riftwalker concept sheets in assets-src/heroes (one standing figure on a flat dark background each, named
# <heroId>.png) into transparent figures at apps/web/public/art/figures/hero-<heroId>.png, then rebuilds the manifest.
# The background is removed by flood-filling from the edges (colour sampled from the corner), so dark clothing inside the
# figure is kept. The sheet of Mire also shows his Bone Thrall and Rivet's shows his drone; both are companions in the game
# already, so those corners are wiped first. Valeria (hero-maren.png) has her own script: tools/pack-valeria.ps1.
# Run: powershell -File tools/pack-heroes.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$srcDir = Join-Path $root 'assets-src/heroes'
$outDir = Join-Path $root 'apps/web/public/art/figures'
New-Item -ItemType Directory -Force $outDir | Out-Null
$maxH = 900

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public static class HeroKey {
  // Make the flat background (br,bg,bb) transparent: only pixels connected to the border and within tol of it.
  // Returns the bounds (x0, y0, x1, y1) of what is left.
  public static int[] Run(Bitmap bmp, int br, int bgc, int bb, double tol, double soft) {
    int w = bmp.Width, h = bmp.Height;
    BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int stride = d.Stride;
    byte[] px = new byte[stride * h];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length);
    Func<int,int,double> dist = (x, y) => {
      int i = y * stride + x * 4;
      double db = px[i] - bb, dg = px[i + 1] - bgc, dr = px[i + 2] - br;
      return Math.Sqrt(db * db + dg * dg + dr * dr);
    };
    bool[] bgMask = new bool[w * h];
    var q = new Queue<int>();
    Action<int,int> push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      int k = y * w + x;
      if (bgMask[k] || dist(x, y) > tol) return;
      bgMask[k] = true; q.Enqueue(k);
    };
    for (int x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (int y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (q.Count > 0) {
      int k = q.Dequeue(); int x = k % w, y = k / w;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
    int x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int k = y * w + x; int i = y * stride + x * 4;
      if (bgMask[k]) { px[i + 3] = 0; continue; }
      // soften the one-pixel fringe next to the background so edges are not jagged
      bool edge = false;
      for (int dy = -1; dy <= 1 && !edge; dy++) for (int dx = -1; dx <= 1; dx++) {
        int nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && bgMask[ny * w + nx]) { edge = true; break; }
      }
      if (edge) {
        double a = Math.Min(1.0, Math.Max(0.0, (dist(x, y) - tol * 0.5) / soft));
        px[i + 3] = (byte)(255 * a);
      }
      if (px[i + 3] > 40) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, px.Length);
    bmp.UnlockBits(d);
    return new int[] { x0, y0, x1, y1 };
  }
}
"@ -ReferencedAssemblies System.Drawing

# hero id -> regions of the sheet to wipe to background first (x, y, w, h)
$wipe = @{
  mire  = @(, @(670, 730, 278, 760))   # the Bone Thrall crouching at the right
  rivet = @(, @(690, 150, 258, 500))   # the hovering drone
}

foreach ($f in Get-ChildItem $srcDir -Filter *.png | Sort-Object Name) {
  $id = $f.BaseName
  $src = New-Object System.Drawing.Bitmap $f.FullName
  $bmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g0 = [System.Drawing.Graphics]::FromImage($bmp)
  $g0.DrawImage($src, 0, 0, $src.Width, $src.Height)
  $bg = $bmp.GetPixel(3, 3)
  if ($wipe.ContainsKey($id)) {
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, $bg.R, $bg.G, $bg.B))
    foreach ($r in $wipe[$id]) { $g0.FillRectangle($brush, $r[0], $r[1], $r[2], $r[3]) }
  }
  $g0.Dispose(); $src.Dispose()
  $b = [HeroKey]::Run($bmp, $bg.R, $bg.G, $bg.B, 24, 40)
  $crop = New-Object System.Drawing.Rectangle $b[0], $b[1], ($b[2] - $b[0] + 1), ($b[3] - $b[1] + 1)
  $k = [math]::Min(1.0, $maxH / $crop.Height)
  $ow = [int][math]::Round($crop.Width * $k); $oh = [int][math]::Round($crop.Height * $k)
  $out = New-Object System.Drawing.Bitmap $ow, $oh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.SmoothingMode = 'HighQuality'
  $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0, 0, $ow, $oh), $crop, 'Pixel')
  $g.Dispose()
  $dest = Join-Path $outDir "hero-$id.png"
  $out.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  "$id -> $dest ${ow}x${oh} (bg $($bg.R),$($bg.G),$($bg.B))"
  $out.Dispose(); $bmp.Dispose()
}
& (Join-Path $PSScriptRoot 'pack-manifest.ps1')
