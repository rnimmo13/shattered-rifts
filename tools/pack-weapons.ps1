# Cuts the weapon and attack-effect sheets in assets-src/weapons (docs/weapon-prompts.md) into the game:
#   weapons-01.png  a 4 x 3 grid of weapons on flat navy, handle at the left -> apps/web/public/art/weapons/<name>.png (cropped)
#   fx-01.png       a 6 x 4 grid: one effect per row, 6 frames each       -> apps/web/public/art/weapons/fx/<effect>-<1..6>.png (whole cells,
#                   so every frame of an effect lines up)
# and writes apps/web/public/art/weapons/index.json, which the fight screen reads (anything missing keeps the drawn effects).
# Weapons are keyed like the hero figures (a flood fill from the edges, so dark outlines inside stay); effects by their distance
# from the background colour, so glows and smoke fade out softly instead of keeping a dark box.
# Run: powershell -File tools/pack-weapons.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$srcDir = Join-Path $root 'assets-src/weapons'
$outDir = Join-Path $root 'apps/web/public/art/weapons'
$fxDir = Join-Path $outDir 'fx'
New-Item -ItemType Directory -Force $outDir, $fxDir | Out-Null

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public static class WeaponKey {
  static byte[] Read(Bitmap bmp, out BitmapData d) {
    d = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    byte[] px = new byte[d.Stride * bmp.Height];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length);
    return px;
  }
  static void Write(Bitmap bmp, BitmapData d, byte[] px) {
    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, px.Length);
    bmp.UnlockBits(d);
  }
  // Flood the background (colour sampled from the corner) away from the edges; returns the bounds of what is left.
  public static int[] Flood(Bitmap bmp, double tol, double soft) {
    int w = bmp.Width, h = bmp.Height;
    BitmapData d; byte[] px = Read(bmp, out d); int stride = d.Stride;
    int br = px[2], bg = px[1], bb = px[0];
    Func<int,int,double> dist = (x, y) => {
      int i = y * stride + x * 4;
      double db = px[i] - bb, dg = px[i + 1] - bg, dr = px[i + 2] - br;
      return Math.Sqrt(db * db + dg * dg + dr * dr);
    };
    bool[] m = new bool[w * h];
    var q = new Queue<int>();
    Action<int,int> push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      int k = y * w + x;
      if (m[k] || dist(x, y) > tol) return;
      m[k] = true; q.Enqueue(k);
    };
    for (int x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (int y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (q.Count > 0) { int k = q.Dequeue(); int x = k % w, y = k / w; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
    // specks of the sheet that are not part of the weapon (a stray dot, a scrap of gutter): any piece smaller than 1% of the
    // biggest is background too
    int[] comp = new int[w * h]; var sizes = new List<int> { 0 };
    for (int s0 = 0; s0 < w * h; s0++) {
      if (m[s0] || comp[s0] != 0) continue;
      int id = sizes.Count, n = 0; var st = new Stack<int>(); st.Push(s0); comp[s0] = id;
      while (st.Count > 0) {
        int k = st.Pop(); n++; int x = k % w, y = k / w;
        int[] nb = { x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1 };
        foreach (int j in nb) if (j >= 0 && !m[j] && comp[j] == 0) { comp[j] = id; st.Push(j); }
      }
      sizes.Add(n);
    }
    int big = 0; foreach (int n in sizes) if (n > big) big = n;
    for (int k = 0; k < w * h; k++) if (!m[k] && sizes[comp[k]] < big / 100) m[k] = true;
    int x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int k = y * w + x, i = y * stride + x * 4;
      if (m[k]) { px[i + 3] = 0; continue; }
      bool edge = false;
      for (int dy = -1; dy <= 1 && !edge; dy++) for (int dx = -1; dx <= 1; dx++) {
        int nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && m[ny * w + nx]) { edge = true; break; }
      }
      if (edge) px[i + 3] = (byte)(255 * Math.Min(1.0, Math.Max(0.0, (dist(x, y) - tol * 0.5) / soft)));
      if (px[i + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    Write(bmp, d, px);
    return new int[] { x0, y0, x1, y1 };
  }
  // Every pixel's alpha is its distance from the background colour (full at `full`), and its colour is un-mixed from the
  // background, so a glow keeps its colour as it fades.
  public static void Soft(Bitmap bmp, double full) {
    int w = bmp.Width, h = bmp.Height;
    BitmapData d; byte[] px = Read(bmp, out d); int stride = d.Stride;
    int br = px[2], bg = px[1], bb = px[0];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int i = y * stride + x * 4;
      double db = px[i] - bb, dg = px[i + 1] - bg, dr = px[i + 2] - br;
      double a = Math.Min(1.0, Math.Sqrt(db * db + dg * dg + dr * dr) / full);
      if (a < 0.14) { px[i + 3] = 0; continue; }
      px[i] = (byte)Math.Max(0, Math.Min(255, bb + db / a));
      px[i + 1] = (byte)Math.Max(0, Math.Min(255, bg + dg / a));
      px[i + 2] = (byte)Math.Max(0, Math.Min(255, br + dr / a));
      px[i + 3] = (byte)(255 * a);
    }
    Write(bmp, d, px);
  }
}
"@ -ReferencedAssemblies System.Drawing

# one cell of a sheet as its own 32-bit bitmap (a small inset keeps the gutters out)
function Cell($sheet, $cols, $rows, $c, $r, $inset) {
  $cw = $sheet.Width / $cols; $ch = $sheet.Height / $rows
  $rect = New-Object System.Drawing.Rectangle ([int]($c * $cw + $inset)), ([int]($r * $ch + $inset)), ([int]($cw - 2 * $inset)), ([int]($ch - 2 * $inset))
  $bmp = New-Object System.Drawing.Bitmap $rect.Width, $rect.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($sheet, (New-Object System.Drawing.Rectangle 0, 0, $rect.Width, $rect.Height), $rect, 'Pixel')
  $g.Dispose()
  return $bmp
}
function Scaled($bmp, $crop, $maxW, $maxH) {
  $k = [math]::Min(1.0, [math]::Min($maxW / $crop.Width, $maxH / $crop.Height))
  $ow = [int][math]::Max(1, [math]::Round($crop.Width * $k)); $oh = [int][math]::Max(1, [math]::Round($crop.Height * $k))
  $out = New-Object System.Drawing.Bitmap $ow, $oh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.SmoothingMode = 'HighQuality'
  $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0, 0, $ow, $oh), $crop, 'Pixel')
  $g.Dispose()
  return $out
}

$index = [ordered]@{ weapons = [ordered]@{}; fx = [ordered]@{} }

# ---- weapons: reading order of docs/weapon-prompts.md, sheet 1
$names = @('sword', 'shield', 'wrench', 'cleaver', 'stiletto', 'throwing-knife', 'totem-staff', 'flame-blade', 'obsidian-blade', 'grave-lantern', 'hammer', 'shotgun')
$wsrc = Join-Path $srcDir 'weapons-01.png'
if (Test-Path $wsrc) {
  $sheet = New-Object System.Drawing.Bitmap $wsrc
  for ($n = 0; $n -lt $names.Count; $n++) {
    $bmp = Cell $sheet 4 3 ($n % 4) ([math]::Floor($n / 4)) 6
    $b = [WeaponKey]::Flood($bmp, 30, 40)
    $crop = New-Object System.Drawing.Rectangle $b[0], $b[1], ($b[2] - $b[0] + 1), ($b[3] - $b[1] + 1)
    $out = Scaled $bmp $crop 512 512
    $file = "$($names[$n]).png"
    $out.Save((Join-Path $outDir $file), [System.Drawing.Imaging.ImageFormat]::Png)
    $index.weapons[$names[$n]] = "weapons/$file"
    "$($names[$n]) $($out.Width)x$($out.Height)"
    $out.Dispose(); $bmp.Dispose()
  }
  $sheet.Dispose()
}

# ---- effects: one row each, 6 frames, sheet 2
$effects = @('muzzle', 'impact', 'spark', 'cast')
$fsrc = Join-Path $srcDir 'fx-01.png'
if (Test-Path $fsrc) {
  $sheet = New-Object System.Drawing.Bitmap $fsrc
  for ($r = 0; $r -lt $effects.Count; $r++) {
    $frames = @()
    for ($c = 0; $c -lt 6; $c++) {
      $bmp = Cell $sheet 6 4 $c $r 12
      [WeaponKey]::Soft($bmp, 70)
      $out = Scaled $bmp (New-Object System.Drawing.Rectangle 0, 0, $bmp.Width, $bmp.Height) 256 256
      $file = "$($effects[$r])-$($c + 1).png"
      $out.Save((Join-Path $fxDir $file), [System.Drawing.Imaging.ImageFormat]::Png)
      $frames += "weapons/fx/$file"
      $out.Dispose(); $bmp.Dispose()
    }
    $index.fx[$effects[$r]] = $frames
    "$($effects[$r]): 6 frames"
  }
  $sheet.Dispose()
}

$json = $index | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText((Join-Path $outDir 'index.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
"index: $($index.weapons.Count) weapons, $($index.fx.Count) effects"
