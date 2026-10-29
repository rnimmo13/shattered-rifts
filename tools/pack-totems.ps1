# Cuts the Shaman's totem sheets in assets-src/weapons into the game (DECISIONS #429):
#   totem.png          three carved totems, left to right Hawk, Bear, Elder Tree -> apps/web/public/art/totems/<kind>.png
#   totem-spirits.png  the same three as spirits                                 -> apps/web/public/art/totems/<kind>-spirit.png
# Both sheets already carry alpha. Each is cut at the emptiest column near each third (the figures can touch); in each piece, a small
# scrap that touches the cut (a claw or a leaf tip of the next figure) is cleared, while loose glow flecks inside are kept; then it is
# trimmed and scaled down. apps/web/public/art/totems/index.json lists what was made (a kind with no picture keeps its drawn mark).
# Run: powershell -File tools/pack-totems.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$srcDir = Join-Path $root 'assets-src/weapons'
$outDir = Join-Path $root 'apps/web/public/art/totems'
New-Item -ItemType Directory -Force $outDir | Out-Null

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public static class TotemCut {
  const int A = 24;
  static byte[] Read(Bitmap bmp, out int stride) {
    BitmapData d = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    byte[] px = new byte[d.Stride * bmp.Height];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length);
    stride = d.Stride; bmp.UnlockBits(d);
    return px;
  }
  /// the cut columns: 0, the emptiest column near each third (w / 8 either side), w
  public static int[] Cuts(Bitmap bmp, int count) {
    int w = bmp.Width, h = bmp.Height, stride; byte[] px = Read(bmp, out stride);
    int[] cov = new int[w];
    for (int x = 0; x < w; x++) for (int y = 0; y < h; y++) if (px[y * stride + x * 4 + 3] > A) cov[x]++;
    var cuts = new List<int> { 0 };
    for (int i = 1; i < count; i++) {
      int c = w * i / count, best = c;
      for (int x = c - w / 8; x <= c + w / 8; x++) if (cov[x] < cov[best]) best = x;
      cuts.Add(best);
    }
    cuts.Add(w);
    return cuts.ToArray();
  }
  /// the figure between columns x0 and x1: scraps touching a cut cleared, trimmed to what is drawn (with a 2-pixel margin)
  public static Bitmap Piece(Bitmap bmp, int x0, int x1) {
    int h = bmp.Height, w = x1 - x0, stride; byte[] src = Read(bmp, out stride);
    var piece = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    BitmapData pd = piece.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int ps = pd.Stride; byte[] px = new byte[ps * h];
    for (int y = 0; y < h; y++) Array.Copy(src, y * stride + x0 * 4, px, y * ps, w * 4);
    // components of drawn pixels (8-connected)
    int[] comp = new int[w * h]; var size = new List<int> { 0 }; var edge = new List<bool> { false };
    for (int s0 = 0; s0 < w * h; s0++) {
      if (comp[s0] != 0 || px[(s0 / w) * ps + (s0 % w) * 4 + 3] <= A) continue;
      int id = size.Count, n = 0; bool touches = false; var st = new Stack<int>(); st.Push(s0); comp[s0] = id;
      while (st.Count > 0) {
        int k = st.Pop(); n++; int x = k % w, y = k / w;
        if (x == 0 || x == w - 1) touches = true;
        for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
          int nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          int j = ny * w + nx;
          if (comp[j] == 0 && px[ny * ps + nx * 4 + 3] > A) { comp[j] = id; st.Push(j); }
        }
      }
      size.Add(n); edge.Add(touches);
    }
    int big = 0; foreach (int n in size) if (n > big) big = n;
    int bx0 = w, by0 = h, bx1 = 0, by1 = 0;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int k = y * w + x, i = y * ps + x * 4, c = comp[k];
      // (a piece of another figure: it touches the cut and is small next to this one)
      if (c != 0 && edge[c] && size[c] < big / 4) { px[i + 3] = 0; continue; }
      // (faint fringe pixels right at the cut go too)
      if (c == 0 && px[i + 3] > 0 && (x < 3 || x > w - 4)) { px[i + 3] = 0; continue; }
      if (px[i + 3] > A) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, pd.Scan0, px.Length);
    piece.UnlockBits(pd);
    int m = 2;
    var r = Rectangle.FromLTRB(Math.Max(0, bx0 - m), Math.Max(0, by0 - m), Math.Min(w, bx1 + 1 + m), Math.Min(h, by1 + 1 + m));
    Bitmap trimmed = piece.Clone(r, PixelFormat.Format32bppArgb);
    piece.Dispose();
    return trimmed;
  }
}
"@ -ReferencedAssemblies System.Drawing

function Save-Scaled($bmp, $path, $maxH) {
  $scale = [Math]::Min(1.0, $maxH / $bmp.Height)
  $ow = [int][Math]::Round($bmp.Width * $scale); $oh = [int][Math]::Round($bmp.Height * $scale)
  $out = New-Object System.Drawing.Bitmap $ow, $oh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($bmp, 0, 0, $ow, $oh)
  $g.Dispose()
  $out.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  "$path ${ow}x${oh}"
}

$kinds = @('hawk', 'bear', 'elder')
$index = [ordered]@{ totems = [ordered]@{}; spirits = [ordered]@{} }
foreach ($sheet in @(@{ file = 'totem.png'; suffix = ''; key = 'totems'; maxH = 320 }, @{ file = 'totem-spirits.png'; suffix = '-spirit'; key = 'spirits'; maxH = 360 })) {
  $bmp = [System.Drawing.Bitmap]::FromFile((Join-Path $srcDir $sheet.file))
  $cuts = [TotemCut]::Cuts($bmp, 3)
  for ($i = 0; $i -lt 3; $i++) {
    $name = "$($kinds[$i])$($sheet.suffix).png"
    $piece = [TotemCut]::Piece($bmp, $cuts[$i], $cuts[$i + 1])
    Save-Scaled $piece (Join-Path $outDir $name) $sheet.maxH
    $piece.Dispose()
    $index[$sheet.key][$kinds[$i]] = "totems/$name"
  }
  $bmp.Dispose()
}
$index | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 (Join-Path $outDir 'index.json')
"wrote $(Join-Path $outDir 'index.json')"
