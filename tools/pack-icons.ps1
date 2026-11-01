# Cuts the status, Boon and pile sheets in assets-src/icons (docs/icon-prompts.md, DECISIONS #510) into apps/web/public/art/icons/<id>.png.
# Each sheet is an even grid of pictures on near-magenta. The background is whatever magenta can be reached from the edge of the sheet, or
# a clear hole of it inside a picture (a ring, a chain link); magenta inside an outline (a violet glow) is left alone. Soft edges keep their
# share of alpha with the magenta taken out of their colour. Each picture is then every piece whose middle falls in its grid cell (a spark
# beside a bolt comes along), trimmed and scaled down. Run: powershell -File tools/pack-icons.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$srcDir = Join-Path $root 'assets-src/icons'
$outDir = Join-Path $root 'apps/web/public/art/icons'
New-Item -ItemType Directory -Force $outDir | Out-Null

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
public static class IconCut {
  // how magenta a pixel is: the smaller of red and blue, less green
  static int Mag(int r, int g, int b) { return Math.Min(r, b) - g; }
  const int Reach = 45;   // the background spreads through anything this magenta
  const int Clear = 170;  // a hole inside a picture is only this magenta or more, so a glow is safe
  const int MinHole = 16;
  public static string Log = "";
  public static Bitmap Key(Bitmap src) {
    int w = src.Width, h = src.Height;
    var bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (var g = Graphics.FromImage(bmp)) g.DrawImage(src, new Rectangle(0, 0, w, h));
    var d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    byte[] px = new byte[d.Stride * h];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length);
    int s = d.Stride;
    // the background's own colour, from the corners
    int br = 0, bg = 0, bb = 0;
    foreach (var c in new[] { 4 * s + 16, 4 * s + (w - 5) * 4, (h - 5) * s + 16, (h - 5) * s + (w - 5) * 4 }) { bb += px[c]; bg += px[c + 1]; br += px[c + 2]; }
    br /= 4; bg /= 4; bb /= 4;
    int full = Mag(br, bg, bb);
    int[] m = new int[w * h];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) { int i = y * s + x * 4; m[y * w + x] = Mag(px[i + 2], px[i + 1], px[i]); }
    var back = new bool[w * h];
    var q = new Queue<int>();
    Action<int> seed = p => { if (!back[p] && m[p] > Reach) { back[p] = true; q.Enqueue(p); } };
    Action spread = () => {
      while (q.Count > 0) {
        int p = q.Dequeue(); int x = p % w, y = p / w;
        if (x > 0) seed(p - 1); if (x < w - 1) seed(p + 1); if (y > 0) seed(p - w); if (y < h - 1) seed(p + w);
      }
    };
    for (int x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
    for (int y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
    spread();
    // holes: a patch of clean background shut inside a picture
    var seen = new bool[w * h];
    for (int p0 = 0; p0 < w * h; p0++) {
      if (seen[p0] || back[p0] || m[p0] <= Clear) continue;
      var patch = new List<int>(); var pq = new Queue<int>(); pq.Enqueue(p0); seen[p0] = true;
      while (pq.Count > 0) {
        int p = pq.Dequeue(); patch.Add(p); int x = p % w, y = p / w;
        foreach (int n in new[] { x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1 })
          if (n >= 0 && !seen[n] && !back[n] && m[n] > Clear) { seen[n] = true; pq.Enqueue(n); }
      }
      if (patch.Count >= MinHole) { foreach (int p in patch) seed(p); spread(); }
    }
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int p = y * w + x, i = y * s + x * 4;
      if (!back[p]) continue;
      double a = 1.0 - Math.Min(1.0, Math.Max(0, m[p]) / (double)full);
      if (a < 0.06) { px[i + 3] = 0; continue; }
      // the pixel is a mix of the picture and the background: take the background out
      for (int k = 0; k < 3; k++) {
        int bgc = k == 0 ? bb : k == 1 ? bg : br;
        px[i + k] = (byte)Math.Max(0, Math.Min(255, (px[i + k] - (1 - a) * bgc) / a));
      }
      px[i + 3] = (byte)(a * 255);
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, px.Length);
    bmp.UnlockBits(d);
    return bmp;
  }
  // every piece of the keyed sheet, handed to the grid cell its middle falls in
  public static Bitmap[] Cells(Bitmap keyed, int cols, int rows, string name) {
    int w = keyed.Width, h = keyed.Height;
    var d = keyed.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    byte[] px = new byte[d.Stride * h];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length);
    keyed.UnlockBits(d);
    int s = d.Stride;
    var lab = new int[w * h];
    var cell = new List<int>[cols * rows];
    for (int c = 0; c < cell.Count(); c++) cell[c] = new List<int>();
    int id = 0;
    for (int p0 = 0; p0 < w * h; p0++) {
      if (lab[p0] != 0 || px[(p0 / w) * s + (p0 % w) * 4 + 3] < 24) continue;
      id++;
      var pts = new List<int>(); var q = new Queue<int>(); q.Enqueue(p0); lab[p0] = id;
      long sx = 0, sy = 0;
      while (q.Count > 0) {
        int p = q.Dequeue(); pts.Add(p); int x = p % w, y = p / w; sx += x; sy += y;
        for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
          int nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          int n = ny * w + nx;
          if (lab[n] == 0 && px[ny * s + nx * 4 + 3] >= 24) { lab[n] = id; q.Enqueue(n); }
        }
      }
      if (pts.Count < 24) continue;
      int cx = (int)(sx / pts.Count), cy = (int)(sy / pts.Count);
      int ci = Math.Min(rows - 1, cy * rows / h) * cols + Math.Min(cols - 1, cx * cols / w);
      cell[ci].AddRange(pts);
    }
    var out_ = new Bitmap[cols * rows];
    for (int c = 0; c < cols * rows; c++) {
      if (cell[c].Count == 0) throw new Exception(name + ": cell " + c + " is empty");
      int x0 = w, y0 = h, x1 = 0, y1 = 0;
      foreach (int p in cell[c]) { int x = p % w, y = p / w; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      // a piece that spills far into the next cell means two pictures have run together
      if ((x1 - x0) > w * 1.15 / cols || (y1 - y0) > h * 1.15 / rows) Log += name + " cell " + c + " is unusually big: " + (x1 - x0) + "x" + (y1 - y0) + "\n";
      var b = new Bitmap(x1 - x0 + 1, y1 - y0 + 1, PixelFormat.Format32bppArgb);
      var t = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
      byte[] op = new byte[t.Stride * b.Height];
      foreach (int p in cell[c]) {
        int x = p % w, y = p / w, i = y * s + x * 4, o = (y - y0) * t.Stride + (x - x0) * 4;
        op[o] = px[i]; op[o + 1] = px[i + 1]; op[o + 2] = px[i + 2]; op[o + 3] = px[i + 3];
      }
      System.Runtime.InteropServices.Marshal.Copy(op, 0, t.Scan0, op.Length);
      b.UnlockBits(t);
      out_[c] = b;
    }
    return out_;
  }
  // scaled to fit a square of this size, centred
  public static void Save(Bitmap b, int size, string path) {
    using (var o = new Bitmap(size, size, PixelFormat.Format32bppArgb))
    using (var g = Graphics.FromImage(o))
    using (var a = new ImageAttributes()) {
      g.Clear(Color.Transparent);
      g.InterpolationMode = InterpolationMode.HighQualityBicubic;
      g.PixelOffsetMode = PixelOffsetMode.HighQuality;
      g.CompositingQuality = CompositingQuality.HighQuality;
      a.SetWrapMode(WrapMode.TileFlipXY);
      double k = Math.Min((double)size / b.Width, (double)size / b.Height);
      int nw = (int)Math.Round(b.Width * k), nh = (int)Math.Round(b.Height * k);
      g.DrawImage(b, new Rectangle((size - nw) / 2, (size - nh) / 2, nw, nh), 0, 0, b.Width, b.Height, GraphicsUnit.Pixel, a);
      o.Save(path, ImageFormat.Png);
    }
  }
}
"@.Replace('cell.Count()', 'cell.Length')

$icon = 96
$pile = 240
$pileIds = foreach ($k in 'draw', 'discard', 'exhaust') { foreach ($n in 1..4) { "pile-$k-$n" } }
$sheets = @(
  @{ f = 'icons-01'; c = 4; r = 3; s = $icon; ids = 'seared burn virulent doom fracture stunned exposed faltering brittle debilitated sapped hangover' -split ' ' },
  @{ f = 'icons-02'; c = 4; r = 3; s = $icon; ids = 'noose strangled quarry bladebane might vigor keen lethality cruelty tracking clutch ritual' -split ' ' },
  @{ f = 'icons-03'; c = 4; r = 3; s = $icon; ids = 'thorns shielded bracing ghostly steadfast armored fortified plating sturdy unmovable guarded blur' -split ' ' },
  @{ f = 'icons-04'; c = 4; r = 3; s = $icon; ids = 'meld reflect buffer taunt calm wrath radiant mantra poised empowered twinned mirrored' -split ' ' },
  @{ f = 'icons-05'; c = 4; r = 3; s = $icon; ids = 'freeattack freeskill freepower freespell freeethereal freeplay unbound echoing boosted orbit holdfast planner' -split ' ' },
  @{ f = 'icons-06'; c = 4; r = 3; s = $icon; ids = 'edge honed fanned deftness bladesweep bladeecho ruinous marrow reaping spellcut umbra twinspell' -split ' ' },
  @{ f = 'boons-01'; c = 4; r = 3; s = $icon; ids = 'iron-sigil thorn-charm might-idol ember-lamp healing-vial rift-satchel crystal-heart coin-purse vigor-wick hex-lantern hunters-lens aegis-of-ages' -split ' ' },
  @{ f = 'boons-02'; c = 4; r = 2; s = $icon; ids = 'gilded-crown ember-heart gluttons-heart blood-heart thorned-heart warded-heart spirit plain-heart' -split ' ' },
  @{ f = 'piles-01'; c = 4; r = 3; s = $pile; ids = $pileIds }
)
$made = 0
foreach ($sheet in $sheets) {
  $src = [System.Drawing.Bitmap]::FromFile((Join-Path $srcDir "$($sheet.f).png"))
  $keyed = [IconCut]::Key($src)
  $src.Dispose()
  $cells = [IconCut]::Cells($keyed, $sheet.c, $sheet.r, $sheet.f)
  for ($i = 0; $i -lt $cells.Length; $i++) {
    # (the plain heart is a spare for something new: nothing shows it yet)
    if ($sheet.ids[$i] -ne 'plain-heart') {
      [IconCut]::Save($cells[$i], $sheet.s, (Join-Path $outDir "$($sheet.ids[$i]).png"))
      $made++
    }
    $cells[$i].Dispose()
  }
  $keyed.Dispose()
}
if ([IconCut]::Log) { Write-Warning ([IconCut]::Log) }
"icons: $made pictures in apps/web/public/art/icons"
