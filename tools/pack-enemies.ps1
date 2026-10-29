# Cuts the multiverse enemy sheets (assets-src/enemies/multiverse-expansion-v1, DECISIONS #437) into the game:
#   <realm>-expansion-v1.png   a 3x3 sheet of enemies on a flat dark ground   -> apps/web/public/art/figures/<unitId>.png
# The ids and their cells come from the sheet folder's enemy-roster.json (cell 0-8, reading order). Enemies face LEFT, toward the
# player; the ones drawn facing right are flipped ($flip). The cutting code is pack-arenas.ps1's (its ArtCut type), so both cut the
# same way; then the manifest is rebuilt.
# Run: powershell -File tools/pack-enemies.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$srcDir = Join-Path $root 'assets-src/enemies/multiverse-expansion-v1'
$figDir = Join-Path $root 'apps/web/public/art/figures'

# ArtCut (Key, Cells...) from pack-arenas.ps1, not copied
$arenas = Get-Content (Join-Path $PSScriptRoot 'pack-arenas.ps1') -Raw
$from = $arenas.IndexOf('@"') + 2
$to = $arenas.IndexOf('"@', $from)
if (-not ([System.Management.Automation.PSTypeName]'ArtCut').Type) {
  Add-Type -TypeDefinition $arenas.Substring($from, $to - $from) -ReferencedAssemblies System.Drawing
}

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public static class EnemyCut {
  /// clear the pockets of ground shut inside figures (between an arm and a body): connected regions of pixels within tol of the
  /// ground's colour, of at least minArea pixels. Scattered dark pixels inside a dark figure are small and stay.
  public static void Pockets(Bitmap bmp, int br, int bg, int bb, double tol, int minArea) {
    int w = bmp.Width, h = bmp.Height;
    BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int stride = d.Stride; byte[] px = new byte[stride * h];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length);
    Func<int, bool> like = (k) => {
      int i = (k / w) * stride + (k % w) * 4; if (px[i + 3] == 0) return false;
      double db = px[i] - bb, dg = px[i + 1] - bg, dr = px[i + 2] - br; return Math.Sqrt(db * db + dg * dg + dr * dr) <= tol;
    };
    bool[] seen = new bool[w * h];
    var region = new List<int>(); var st = new Stack<int>();
    for (int s0 = 0; s0 < w * h; s0++) {
      if (seen[s0] || !like(s0)) continue;
      region.Clear(); st.Push(s0); seen[s0] = true;
      while (st.Count > 0) {
        int k = st.Pop(); region.Add(k); int x = k % w, y = k / w;
        int[] nb = { x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1 };
        foreach (int j in nb) if (j >= 0 && !seen[j] && like(j)) { seen[j] = true; st.Push(j); }
      }
      if (region.Count >= minArea) foreach (int k in region) px[(k / w) * stride + (k % w) * 4 + 3] = 0;
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, px.Length); bmp.UnlockBits(d);
  }
  /// the figures of a keyed cols x rows sheet, in reading order (null for an empty cell): every 8-connected piece of drawn pixels
  /// (alpha over 24) belongs to the cell its centre of mass is in; specks under 30 pixels are dropped; each figure is trimmed, with
  /// a 2-pixel margin
  public static Bitmap[] Figures(Bitmap keyed, int cols, int rows) {
    int w = keyed.Width, h = keyed.Height;
    BitmapData d = keyed.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int stride = d.Stride; byte[] px = new byte[stride * h];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length); keyed.UnlockBits(d);
    int[] comp = new int[w * h]; var cellOf = new List<int> { -1 }; var size = new List<int> { 0 };
    for (int s0 = 0; s0 < w * h; s0++) {
      if (comp[s0] != 0 || px[(s0 / w) * stride + (s0 % w) * 4 + 3] <= 24) continue;
      int id = size.Count, n = 0; long sx = 0, sy = 0; var st = new Stack<int>(); st.Push(s0); comp[s0] = id;
      while (st.Count > 0) {
        int k = st.Pop(); n++; int x = k % w, y = k / w; sx += x; sy += y;
        for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
          int nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          int j = ny * w + nx;
          if (comp[j] == 0 && px[ny * stride + nx * 4 + 3] > 24) { comp[j] = id; st.Push(j); }
        }
      }
      size.Add(n);
      int cx = (int)(sx / n) * cols / w, cy = (int)(sy / n) * rows / h;
      cellOf.Add(n < 30 ? -1 : Math.Min(rows - 1, cy) * cols + Math.Min(cols - 1, cx));
    }
    // (a small piece, under 3% of the cell's biggest, that lies off that biggest piece's box is a stray bit of a neighbour: dropped)
    int nC = size.Count;
    int[] bx0 = new int[nC], by0 = new int[nC], bx1 = new int[nC], by1 = new int[nC];
    for (int k = 1; k < nC; k++) { bx0[k] = w; by0[k] = h; bx1[k] = -1; by1[k] = -1; }
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int k = comp[y * w + x]; if (k == 0) continue;
      if (x < bx0[k]) bx0[k] = x; if (x > bx1[k]) bx1[k] = x; if (y < by0[k]) by0[k] = y; if (y > by1[k]) by1[k] = y;
    }
    var main = new int[cols * rows];
    for (int k = 1; k < nC; k++) { int c = cellOf[k]; if (c >= 0 && (main[c] == 0 || size[k] > size[main[c]])) main[c] = k; }
    for (int k = 1; k < nC; k++) {
      int c = cellOf[k]; if (c < 0 || main[c] == k) continue;
      int mk = main[c], pad = 8;
      bool off = bx1[k] < bx0[mk] - pad || bx0[k] > bx1[mk] + pad || by1[k] < by0[mk] - pad || by0[k] > by1[mk] + pad;
      if (off && size[k] * 100 < size[mk] * 3) cellOf[k] = -1;
    }
    var outl = new Bitmap[cols * rows];
    for (int c = 0; c < cols * rows; c++) {
      int x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
        int k = comp[y * w + x];
        if (k == 0 || cellOf[k] != c) continue;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 < 0) continue;
      int m = 2; x0 = Math.Max(0, x0 - m); y0 = Math.Max(0, y0 - m); x1 = Math.Min(w - 1, x1 + m); y1 = Math.Min(h - 1, y1 + m);
      int ow = x1 - x0 + 1, oh = y1 - y0 + 1;
      var o = new Bitmap(ow, oh, PixelFormat.Format32bppArgb);
      BitmapData od = o.LockBits(new Rectangle(0, 0, ow, oh), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
      byte[] op = new byte[od.Stride * oh];
      for (int y = 0; y < oh; y++) for (int x = 0; x < ow; x++) {
        int sxp = x0 + x, syp = y0 + y, k = comp[syp * w + sxp];
        // (the soft fringe around a piece, alpha 24 or under, is kept with the piece next to it)
        bool mine = k == 0 ? Near(comp, cellOf, w, h, sxp, syp, c) : cellOf[k] == c;
        if (!mine) continue;
        int i = syp * stride + sxp * 4, j = y * od.Stride + x * 4;
        op[j] = px[i]; op[j + 1] = px[i + 1]; op[j + 2] = px[i + 2]; op[j + 3] = px[i + 3];
      }
      System.Runtime.InteropServices.Marshal.Copy(op, 0, od.Scan0, op.Length); o.UnlockBits(od);
      outl[c] = o;
    }
    return outl;
  }
  static bool Near(int[] comp, List<int> cellOf, int w, int h, int x, int y, int c) {
    for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
      int nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      int k = comp[ny * w + nx];
      if (k != 0 && cellOf[k] == c) return true;
    }
    return false;
  }
}
"@ -ReferencedAssemblies System.Drawing

function Scale-To($bmp, $maxH, $maxW) {
  $k = [math]::Min([math]::Min(1.0, $maxH / $bmp.Height), [math]::Min(1.0, $maxW / $bmp.Width))
  $w = [int][math]::Max(1, [math]::Round($bmp.Width * $k)); $h = [int][math]::Max(1, [math]::Round($bmp.Height * $k))
  $o = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($o)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.SmoothingMode = 'HighQuality'
  $g.DrawImage($bmp, 0, 0, $w, $h); $g.Dispose(); $o
}

# the figures drawn facing right on their sheet, to be flipped to face the player (none: each of the 62 was looked at, and faces
# left or the front)
$flip = @()

$roster = (Get-Content (Join-Path $srcDir 'enemy-roster.json') -Raw | ConvertFrom-Json).enemies
$sheets = $roster | Group-Object artSheet
foreach ($s in $sheets) {
  $path = Join-Path $srcDir $s.Name
  if (-not (Test-Path $path)) { Write-Warning "skip $($s.Name) (missing)"; continue }
  $sheet = New-Object System.Drawing.Bitmap $path
  $bg = $sheet.GetPixel(3, 3)
  # (the ground is flat: flood from the edges; then clear only pockets of ground shut inside a figure that are a real region of the
  # ground's colour, 250 pixels or more: clearing every ground-coloured pixel punched holes in dark figures, the Queen's gown)
  $keyed = [ArtCut]::Key($sheet, $bg.R, $bg.G, $bg.B, 26, 40, 0)
  [EnemyCut]::Pockets($keyed, $bg.R, $bg.G, $bg.B, 12, 250)
  # (every separate piece of the sheet goes to the cell its middle is in, so a neighbour's claw or moon that reaches over the line
  # stays with its own figure)
  $cells = [EnemyCut]::Figures($keyed, 3, 3)
  foreach ($e in $s.Group) {
    $cell = $cells[[int]$e.cell]
    if ($null -eq $cell) { Write-Warning "$($s.Name): cell $($e.cell) ($($e.id)) is empty"; continue }
    $bm = $cell
    if ($flip -contains $e.id) { $bm = $cell.Clone(); $bm.RotateFlip('RotateNoneFlipX') }
    $out = Scale-To $bm 900 900
    $out.Save((Join-Path $figDir "$($e.id).png"), [System.Drawing.Imaging.ImageFormat]::Png)
    "enemy $($e.id) $($out.Width)x$($out.Height)"
    $out.Dispose()
  }
  $keyed.Dispose(); $sheet.Dispose()
}
& (Join-Path $PSScriptRoot 'pack-manifest.ps1')
