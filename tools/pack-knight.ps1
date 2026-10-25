# Cuts Valeria's standing pose from the concept sheet in assets-src/valeria into the real hero figure (art key hero:knight,
# the hero id stays "knight"). The sheet has a flat dark background: it is removed by flood-filling from the edges, so dark
# armour inside the figure is kept. Run: powershell -File tools/pack-knight.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$sheet = Join-Path $root 'assets-src/valeria/Paladin Attack Animation Concept Sheet.png'
$out = Join-Path $root 'apps/web/public/art/figures/hero-knight.png'
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public static class BgKey {
  // Make the flat background (br,bg,bb) transparent: only pixels connected to the border and within tol of it.
  public static void Run(Bitmap bmp, int br, int bgc, int bb, double tol, double soft) {
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
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, px.Length);
    bmp.UnlockBits(d);
  }
}
"@ -ReferencedAssemblies System.Drawing

$src = New-Object System.Drawing.Bitmap $sheet
# wipe the "Idle / Standing" caption (it sits between her boots) so it is not kept
$g0 = [System.Drawing.Graphics]::FromImage($src)
$g0.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 20, 28, 35))), 118, 704, 170, 50)
$g0.Dispose()
$crop = New-Object System.Drawing.Rectangle 0, 20, 400, 706
$fig = New-Object System.Drawing.Bitmap $crop.Width, $crop.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($fig)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $crop.Width, $crop.Height), $crop, 'Pixel')
$g.Dispose()
[BgKey]::Run($fig, 20, 28, 35, 22, 40)
$fig.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
"$out $($fig.Width)x$($fig.Height)"
$fig.Dispose(); $src.Dispose()
& (Join-Path $PSScriptRoot 'pack-manifest.ps1')
