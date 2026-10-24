# Cuts the AI art sheets in assets-src into game files, then rebuilds the manifest.
#   assets-src/minions/*.png          sheets of companions   -> apps/web/public/art/figures/<unitId>.png
#   assets-src/arenas/backdrops/*.png  wide scenery panoramas -> apps/web/public/art/arenas/<venue>/backdrop.jpg
#   assets-src/arenas/props/*.png      3x3 prop sheets        -> apps/web/public/art/arenas/<venue>/props/<name>.png + props.json
#   assets-src/arenas/floors/*.png     4x2 floor tile sheet   -> apps/web/public/art/arenas/<venue>/floor.png (made seamless)
# Venue ids are the fight screen's (duel/scene/venue.ts): castle factory forest cave glass swamp alley rift.
# Run: powershell -File tools/pack-arenas.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$src = Join-Path $root 'assets-src'
$pub = Join-Path $root 'apps/web/public/art'

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public class Piece { public Bitmap Bmp; public int X, Y, W, H; }
public static class ArtCut {
  static byte[] Read(Bitmap b, out int stride) {
    BitmapData d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    stride = d.Stride; byte[] px = new byte[d.Stride * b.Height];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length); b.UnlockBits(d); return px;
  }
  static void Write(Bitmap b, byte[] px) {
    BitmapData d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, px.Length); b.UnlockBits(d);
  }
  // Turn the flat background transparent: flood from the edges within tol of (br,bg,bb); with 'everywhere' also any pixel within tol2
  // (holes inside arches and handles). A one-pixel fringe is softened.
  public static Bitmap Key(Bitmap src, int br, int bg, int bb, double tol, double soft, double tol2) {
    int w = src.Width, h = src.Height;
    Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(bmp)) g.DrawImage(src, 0, 0, w, h);
    int stride; byte[] px = Read(bmp, out stride);
    Func<int,int,double> dist = (x, y) => { int i = y * stride + x * 4; double db = px[i]-bb, dg = px[i+1]-bg, dr = px[i+2]-br; return Math.Sqrt(db*db+dg*dg+dr*dr); };
    bool[] m = new bool[w * h]; var q = new Queue<int>();
    Action<int,int> push = (x, y) => { if (x<0||y<0||x>=w||y>=h) return; int k=y*w+x; if (m[k]||dist(x,y)>tol) return; m[k]=true; q.Enqueue(k); };
    for (int x = 0; x < w; x++) { push(x,0); push(x,h-1); }
    for (int y = 0; y < h; y++) { push(0,y); push(w-1,y); }
    while (q.Count > 0) { int k=q.Dequeue(); int x=k%w, y=k/w; push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1); }
    if (tol2 > 0) for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (!m[y*w+x] && dist(x,y) <= tol2) m[y*w+x] = true;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int k = y*w+x, i = y*stride+x*4;
      if (m[k]) { px[i+3] = 0; continue; }
      bool edge = false;
      for (int dy=-1; dy<=1 && !edge; dy++) for (int dx=-1; dx<=1; dx++) { int nx=x+dx, ny=y+dy; if (nx>=0&&ny>=0&&nx<w&&ny<h&&m[ny*w+nx]) { edge=true; break; } }
      if (edge) { double a = Math.Min(1.0, Math.Max(0.0, (dist(x,y) - tol*0.5)/soft)); px[i+3] = (byte)(255*a); }
    }
    Write(bmp, px); return bmp;
  }
  // Separate objects of a keyed sheet: blocks of 4px, dilated by 'gap' px, labelled; pieces smaller than minArea (px) are dropped.
  public static List<Piece> Split(Bitmap keyed, int gap, int minArea, int thr) {
    int w = keyed.Width, h = keyed.Height, B = 4;
    int stride; byte[] px = Read(keyed, out stride);
    int bw = (w + B - 1) / B, bh = (h + B - 1) / B;
    bool[] on = new bool[bw * bh];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (px[y*stride+x*4+3] > thr) on[(y/B)*bw + x/B] = true;
    int r = Math.Max(1, gap / B);
    bool[] dil = new bool[bw * bh];
    for (int y = 0; y < bh; y++) for (int x = 0; x < bw; x++) if (on[y*bw+x])
      for (int dy=-r; dy<=r; dy++) for (int dx=-r; dx<=r; dx++) { int nx=x+dx, ny=y+dy; if (nx>=0&&ny>=0&&nx<bw&&ny<bh) dil[ny*bw+nx] = true; }
    int[] lab = new int[bw * bh]; int n = 0;
    for (int s = 0; s < dil.Length; s++) {
      if (!dil[s] || lab[s] != 0) continue;
      n++; var q = new Queue<int>(); q.Enqueue(s); lab[s] = n;
      while (q.Count > 0) { int k=q.Dequeue(); int x=k%bw, y=k/bw;
        int[] nb = { x>0?k-1:-1, x<bw-1?k+1:-1, y>0?k-bw:-1, y<bh-1?k+bw:-1 };
        foreach (int j in nb) if (j>=0 && dil[j] && lab[j]==0) { lab[j]=n; q.Enqueue(j); } }
    }
    var res = new List<Piece>();
    for (int id = 1; id <= n; id++) {
      int x0=w, y0=h, x1=-1, y1=-1; long area = 0;
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
        if (lab[(y/B)*bw + x/B] != id || px[y*stride+x*4+3] <= 40) continue;
        area++; if (x<x0) x0=x; if (x>x1) x1=x; if (y<y0) y0=y; if (y>y1) y1=y;
      }
      if (area < minArea) continue;
      int cw = x1-x0+1, ch = y1-y0+1;
      Bitmap bm = new Bitmap(cw, ch, PixelFormat.Format32bppArgb);
      byte[] o = new byte[cw * ch * 4];
      for (int y = 0; y < ch; y++) for (int x = 0; x < cw; x++) {
        int sx = x0+x, sy = y0+y;
        if (lab[(sy/B)*bw + sx/B] != id) continue;
        int i = sy*stride+sx*4, j = (y*cw+x)*4;
        o[j]=px[i]; o[j+1]=px[i+1]; o[j+2]=px[i+2]; o[j+3]=px[i+3];
      }
      Write(bm, o);
      res.Add(new Piece { Bmp = bm, X = x0, Y = y0, W = cw, H = ch });
    }
    return res;
  }
  // Rows (where the scenery stops and the flat ground band starts): the lowest row whose horizontal contrast is above 'thr'.
  public static int LastBusyRow(Bitmap b, double thr) {
    int stride; byte[] px = Read(b, out stride);
    for (int y = b.Height - 1; y >= 0; y--) {
      double s = 0; int n = 0;
      for (int x = 1; x < b.Width; x += 2) { int i=y*stride+x*4, j=i-8; s += Math.Abs(px[i]-px[j]) + Math.Abs(px[i+1]-px[j+1]) + Math.Abs(px[i+2]-px[j+2]); n++; }
      if (s / n > thr) return y;
    }
    return 0;
  }
  // Find the objects of a keyed sheet. Solid pixels (alpha > thr) are grouped into 4px blocks and eroded by 'erode' blocks, which breaks
  // thin bridges (soft glows, touching tips) between neighbours. The surviving cores seed the objects; every other block takes the
  // nearest core's label (so touching objects are cut where they meet, and a loose wing or spark stays with its owner).
  public static List<Piece> Objects(Bitmap keyed, int thr, int erode, int reach, double minFrac) {
    int w = keyed.Width, h = keyed.Height, B = 4;
    int stride; byte[] px = Read(keyed, out stride);
    int bw = (w + B - 1) / B, bh = (h + B - 1) / B;
    bool[] solid = new bool[bw * bh], any = new bool[bw * bh];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int a = px[y*stride+x*4+3]; int k = (y/B)*bw + x/B;
      if (a > thr) solid[k] = true; if (a > 40) any[k] = true;
    }
    bool[] core = (bool[])solid.Clone();
    for (int e = 0; e < erode; e++) {
      bool[] nx = new bool[core.Length];
      for (int y = 1; y < bh - 1; y++) for (int x = 1; x < bw - 1; x++) {
        int k = y*bw+x; nx[k] = core[k] && core[k-1] && core[k+1] && core[k-bw] && core[k+bw];
      }
      core = nx;
    }
    int[] lab = new int[bw * bh]; int n = 0; var sizes = new List<int>();
    for (int s0 = 0; s0 < core.Length; s0++) {
      if (!core[s0] || lab[s0] != 0) continue;
      n++; int cnt = 0; var q = new Queue<int>(); q.Enqueue(s0); lab[s0] = n;
      while (q.Count > 0) { int k = q.Dequeue(); cnt++; int x = k % bw, y = k / bw;
        int[] nb = { x>0?k-1:-1, x<bw-1?k+1:-1, y>0?k-bw:-1, y<bh-1?k+bw:-1 };
        foreach (int j in nb) if (j >= 0 && core[j] && lab[j] == 0) { lab[j] = n; q.Enqueue(j); } }
      sizes.Add(cnt);
    }
    int mx = 0; foreach (int c in sizes) mx = Math.Max(mx, c);
    var keepLab = new bool[n + 1];
    for (int i = 0; i < n; i++) keepLab[i + 1] = sizes[i] >= mx * minFrac;
    for (int k = 0; k < lab.Length; k++) if (lab[k] != 0 && !keepLab[lab[k]]) lab[k] = 0;
    // grow the cores through every block that has something in it (multi-source, nearest wins)
    var qq = new Queue<int>(); for (int k = 0; k < lab.Length; k++) if (lab[k] != 0) qq.Enqueue(k);
    while (qq.Count > 0) { int k = qq.Dequeue(); int x = k % bw, y = k / bw;
      int[] nb = { x>0?k-1:-1, x<bw-1?k+1:-1, y>0?k-bw:-1, y<bh-1?k+bw:-1 };
      foreach (int j in nb) if (j >= 0 && any[j] && lab[j] == 0) { lab[j] = lab[k]; qq.Enqueue(j); } }
    // anything still loose (a detached wing) joins the nearest object within 'reach' blocks
    for (int y = 0; y < bh; y++) for (int x = 0; x < bw; x++) {
      int k = y*bw+x; if (!any[k] || lab[k] != 0) continue;
      int best = 0, bd = int.MaxValue;
      for (int dy = -reach; dy <= reach; dy++) for (int dx = -reach; dx <= reach; dx++) {
        int nx = x+dx, ny = y+dy; if (nx<0||ny<0||nx>=bw||ny>=bh) continue;
        int l = lab[ny*bw+nx]; if (l == 0) continue; int d = dx*dx+dy*dy; if (d < bd) { bd = d; best = l; } }
      if (best != 0) lab[k] = -best;   // negative: assigned after the pass so it does not chain
    }
    for (int k = 0; k < lab.Length; k++) if (lab[k] < 0) lab[k] = -lab[k];
    var res = new List<Piece>();
    for (int id = 1; id <= n; id++) {
      if (!keepLab[id]) continue;
      int x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
        if (lab[(y/B)*bw + x/B] != id || px[y*stride+x*4+3] <= 40) continue;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 < 0) continue;
      int cw = x1-x0+1, ch = y1-y0+1; byte[] o = new byte[cw*ch*4];
      for (int y = 0; y < ch; y++) for (int x = 0; x < cw; x++) {
        int sx = x0+x, sy = y0+y; if (lab[(sy/B)*bw + sx/B] != id) continue;
        int i = sy*stride+sx*4, j = (y*cw+x)*4; o[j]=px[i]; o[j+1]=px[i+1]; o[j+2]=px[i+2]; o[j+3]=px[i+3];
      }
      Bitmap bm = new Bitmap(cw, ch, PixelFormat.Format32bppArgb); Write(bm, o);
      res.Add(new Piece { Bmp = bm, X = x0, Y = y0, W = cw, H = ch });
    }
    return res;
  }
  // For sheets laid out as an even grid with clear margins: cut at the emptiest rows/columns near the even divisions and keep each
  // cell's main pieces (3x3 prop sheets).
  static int Valley(int[] proj, int expect, int span, int win) {
    int best = expect; double bv = double.MaxValue;
    for (int p = Math.Max(win, expect - span); p <= Math.Min(proj.Length - win - 1, expect + span); p++) {
      double v = 0; for (int k = -win; k <= win; k++) v += proj[p + k];
      if (v < bv) { bv = v; best = p; }
    }
    return best;
  }
  public static List<Bitmap> Cells(Bitmap keyed, int cols, int rows) {
    int w = keyed.Width, h = keyed.Height;
    int stride; byte[] px = Read(keyed, out stride);
    int[] rp = new int[h];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (px[y*stride+x*4+3] > 90) rp[y]++;
    int[] ry = new int[rows + 1]; ry[0] = 0; ry[rows] = h;
    for (int r = 1; r < rows; r++) ry[r] = Valley(rp, r * h / rows, h / 10, 6);
    int[] cp = new int[w];
    for (int x = 0; x < w; x++) for (int y = 0; y < h; y++) if (px[y*stride+x*4+3] > 90) cp[x]++;
    int[] cx = new int[cols + 1]; cx[0] = 0; cx[cols] = w;
    for (int c = 1; c < cols; c++) cx[c] = Valley(cp, c * w / cols, w / 10, 6);
    var outl = new List<Bitmap>();
    for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) {
      Rectangle rc = new Rectangle(cx[c], ry[r], cx[c+1] - cx[c], ry[r+1] - ry[r]);
      Bitmap cell = keyed.Clone(rc, PixelFormat.Format32bppArgb);
      var parts = Split(cell, 8, 1500, 40);
      if (parts.Count == 0) { outl.Add(null); continue; }
      long maxA = 0; foreach (var p in parts) maxA = Math.Max(maxA, (long)p.W * p.H);
      // keep the main pieces; slivers of a neighbour that cross into the cell touch its border and are dropped
      var keep = parts.FindAll(p => (long)p.W * p.H >= maxA * 0.03 && !(((long)p.W * p.H < maxA * 0.3) && (p.X <= 1 || p.Y <= 1 || p.X + p.W >= cell.Width - 1 || p.Y + p.H >= cell.Height - 1)));
      int x0 = int.MaxValue, y0 = int.MaxValue, x1 = 0, y1 = 0;
      foreach (var p in keep) { x0 = Math.Min(x0, p.X); y0 = Math.Min(y0, p.Y); x1 = Math.Max(x1, p.X + p.W); y1 = Math.Max(y1, p.Y + p.H); }
      Bitmap o = new Bitmap(x1 - x0, y1 - y0, PixelFormat.Format32bppArgb);
      using (Graphics g = Graphics.FromImage(o)) foreach (var p in keep) g.DrawImage(p.Bmp, p.X - x0, p.Y - y0);
      outl.Add(o);
    }
    return outl;
  }
  // Make a square tile seamless: blend it with a copy shifted by half, weighted 1 in the middle and 0 at the edges.
  public static Bitmap Seamless(Bitmap t) {
    int n = t.Width; int stride; byte[] px = Read(t, out stride);
    Bitmap o = new Bitmap(n, n, PixelFormat.Format32bppArgb); byte[] r = new byte[stride * n];
    for (int y = 0; y < n; y++) for (int x = 0; x < n; x++) {
      double wx = 1 - Math.Abs(x - (n - 1) / 2.0) / (n / 2.0), wy = 1 - Math.Abs(y - (n - 1) / 2.0) / (n / 2.0);
      double wgt = Math.Min(1, Math.Min(wx, wy) * 2.2); wgt = wgt * wgt * (3 - 2 * wgt);
      int i = y*stride+x*4, j = ((y+n/2)%n)*stride + ((x+n/2)%n)*4;
      for (int c = 0; c < 3; c++) r[i+c] = (byte)(px[i+c]*wgt + px[j+c]*(1-wgt));
      r[i+3] = 255;
    }
    Write(o, r); return o;
  }
}
"@ -ReferencedAssemblies System.Drawing

function Open-Bmp($path) { New-Object System.Drawing.Bitmap $path }
function Scale-To($bmp, $maxH, $maxW) {
  $k = [math]::Min([math]::Min(1.0, $maxH / $bmp.Height), [math]::Min(1.0, $maxW / $bmp.Width))
  $w = [int][math]::Max(1, [math]::Round($bmp.Width * $k)); $h = [int][math]::Max(1, [math]::Round($bmp.Height * $k))
  $o = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($o)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.SmoothingMode = 'HighQuality'
  $g.DrawImage($bmp, 0, 0, $w, $h); $g.Dispose(); $o
}
function Key-Sheet($bmp, $tol, $tol2) { $bg = $bmp.GetPixel(3, 3); [ArtCut]::Key($bmp, $bg.R, $bg.G, $bg.B, $tol, 40, $tol2) }
# cell index of a piece on a cols x rows sheet, for reading order
function Order-Pieces($pieces, $w, $h, $cols, $rows) {
  $pieces | Sort-Object @{ e = { [math]::Floor(($_.Y + $_.H / 2) / ($h / $rows)) * 100 + [math]::Floor(($_.X + $_.W / 2) / ($w / $cols)) } }, X
}
function Save-Jpeg($bmp, $path, $q) {
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$q)
  $bmp.Save($path, $enc, $ep)
}
function Flip-X($bmp) { $c = $bmp.Clone(); $c.RotateFlip('RotateNoneFlipX'); $c }

# ---------------------------------------------------------------- minions (companions)
# sheet file -> grid (cols, rows), the unit ids in reading order, and which of them face left on the sheet (flipped to face right)
$minions = @(
  @{ file = 'minions/mechs.png'; cols = 3; rows = 3
     ids = 'drone', 'patrol-drone', 'sentry-turret', 'salvage-bot', 'repair-bot', 'enforcer', 'war-engine', 'micro-drone', 'siege-engine'; flip = @() },
  @{ file = 'minions/beasts.png'; cols = 3; rows = 2
     ids = 'hound', 'dire-wolf', 'maw-hatchling', 'gnashling', 'gilded-guard'; flip = @() },
  @{ file = 'minions/gloomfen.png'; cols = 3; rows = 1
     ids = 'bone-thrall', 'grave-colossus', 'drowned-king'; flip = @() },
  # enemies (assets-src/enemies, see docs/enemy-prompts.md): they face LEFT on the sheet, toward the player
  @{ file = 'enemies/aurelion.png'; cols = 3; rows = 3
     ids = 'squire', 'squire-recruit', 'gilded-page', 'gilded-halberdier', 'bell-cleric', 'wandering-knight', 'templar-aldric', 'inquisitor-maelis', 'seraphine'; flip = @() },
  @{ file = 'enemies/nexus.png'; cols = 3; rows = 2
     ids = 'scrap-drone', 'line-technician', 'patrol-unit', 'scrap-collector', 'hive-7', 'kron'; flip = @() },
  @{ file = 'enemies/rift.png'; frac = 0.1; cols = 2; rows = 2
     ids = 'raptor', 'lost-courtier', 'lamplighter', 'rift-shard'; flip = @() },
  @{ file = 'enemies/redo-1.png'; frac = 0.1; cols = 3; rows = 2
     ids = 'acid-spitter', 'maw-spawn', 'hooded-acolyte', 'ghostwire', 'feral-riftling', 'bloated-one'; flip = @() },
  @{ file = 'enemies/redo-2.png'; frac = 0.1; cols = 3; rows = 2
     ids = 'whisperer', 'choir-of-silence', 'nyxara', 'packmother-ruhn', 'gorrmaw', 'vorthax'; flip = @() }
)
$figDir = Join-Path $pub 'figures'
foreach ($m in $minions) {
  $path = Join-Path $src $m.file
  if (-not (Test-Path $path)) { "skip $($m.file) (missing)"; continue }
  $sheet = Open-Bmp $path
  $keyed = Key-Sheet $sheet 26 0
  $found = @([ArtCut]::Objects($keyed, 140, 2, 8, $(if ($m.frac) { $m.frac } else { 0.04 })))
  if ($found.Count -gt $m.ids.Count) {
    # more pieces than figures (a lantern apart from its bearer): join the pieces that share a cell of the sheet
    $cells = @{}
    foreach ($pc in $found) {
      $ci = [int]([math]::Floor(($pc.Y + $pc.H / 2) / ($sheet.Height / $m.rows)) * 100 + [math]::Floor(($pc.X + $pc.W / 2) / ($sheet.Width / $m.cols)))
      if (-not $cells.ContainsKey($ci)) { $cells[$ci] = @() }
      $cells[$ci] += $pc
    }
    $found = @(foreach ($ci in $cells.Keys) {
      $grp = $cells[$ci]
      $x0 = ($grp | Measure-Object X -Minimum).Minimum; $y0 = ($grp | Measure-Object Y -Minimum).Minimum
      $x1 = ($grp | ForEach-Object { $_.X + $_.W } | Measure-Object -Maximum).Maximum; $y1 = ($grp | ForEach-Object { $_.Y + $_.H } | Measure-Object -Maximum).Maximum
      $u = New-Object System.Drawing.Bitmap ($x1 - $x0), ($y1 - $y0), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $ug = [System.Drawing.Graphics]::FromImage($u)
      foreach ($pc in $grp) { $ug.DrawImage($pc.Bmp, $pc.X - $x0, $pc.Y - $y0) }
      $ug.Dispose()
      New-Object Piece -Property @{ Bmp = $u; X = $x0; Y = $y0; W = ($x1 - $x0); H = ($y1 - $y0) }
    })
  }
  $parts = @(Order-Pieces $found $sheet.Width $sheet.Height $m.cols $m.rows)
  if ($parts.Count -ne $m.ids.Count) { Write-Warning "$($m.file): found $($parts.Count) pieces, expected $($m.ids.Count): sheet skipped"; continue }
  for ($i = 0; $i -lt [math]::Min($parts.Count, $m.ids.Count); $i++) {
    $id = $m.ids[$i]; $bm = $parts[$i].Bmp
    if ($m.flip -contains $id) { $bm = Flip-X $bm }
    $out = Scale-To $bm 900 900
    $out.Save((Join-Path $figDir "$id.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    "minion $id $($out.Width)x$($out.Height)"
    $out.Dispose()
  }
}

# ---------------------------------------------------------------- arenas
# venue -> its source images
$arenas = @{
  castle  = @{ backdrop = 'aurelion'; props = 'aurelion'; floor = 0 }
  factory = @{ backdrop = 'nexus'; props = 'nexus'; floor = 1 }
  forest  = @{ backdrop = 'wyldmaw'; props = 'wyldmaw'; floor = 2 }
  cave    = @{ backdrop = 'umbral'; props = 'umbral'; floor = 3 }
  glass   = @{ backdrop = $null; props = $null; floor = 4 }
  swamp   = @{ backdrop = 'gloomfen'; props = 'gloomfen'; floor = 5 }
  alley   = @{ backdrop = $null; props = $null; floor = 6 }
  rift    = @{ backdrop = 'rift'; props = $null; floor = 7 }
}
# the backdrop is baked to the scene's sky size (stage + padding: 3040 x 690) with the horizon at y = 655
$skyW = 3040; $skyH = 690; $horizon = 655; $artW = 2560
foreach ($v in $arenas.Keys) {
  $vd = Join-Path $pub "arenas/$v"
  New-Item -ItemType Directory -Force (Join-Path $vd 'props') | Out-Null
  $a = $arenas[$v]

  if ($a.backdrop) {
    $p = Join-Path $src "arenas/backdrops/$($a.backdrop).png"
    if (Test-Path $p) {
      $b = Open-Bmp $p
      $hz = if ($a.backdrop -eq 'rift') { [int]($b.Height * 0.6) } else { [ArtCut]::LastBusyRow($b, 5.0) }
      $k = $artW / $b.Width
      $y0 = $horizon - $hz * $k
      $c = New-Object System.Drawing.Bitmap $skyW, $skyH
      $g = [System.Drawing.Graphics]::FromImage($c)
      $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
      $x0 = ($skyW - $artW) / 2
      # the ground band colour, sampled under the horizon, fills everything below it
      $gc = $b.GetPixel([int]($b.Width / 2), [math]::Min($b.Height - 1, $hz + 40))
      $g.Clear($gc)
      # the sides beyond the art repeat its outer edge, darkened
      foreach ($side in 0, 1) {
        $sx = if ($side -eq 0) { 0 } else { $b.Width - 6 }
        $dx = if ($side -eq 0) { 0 } else { $x0 + $artW }
        $g.DrawImage($b, (New-Object System.Drawing.Rectangle $dx, 0, $x0, $skyH), (New-Object System.Drawing.Rectangle $sx, 0, 6, $b.Height), 'Pixel')
      }
      $g.DrawImage($b, $x0, $y0, $artW, $b.Height * $k)
      $shade = New-Object System.Drawing.Drawing2D.LinearGradientBrush ((New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point $x0, 0), [System.Drawing.Color]::FromArgb(235, $gc.R, $gc.G, $gc.B), [System.Drawing.Color]::FromArgb(0, $gc.R, $gc.G, $gc.B))
      $g.FillRectangle($shade, 0, 0, $x0, $skyH)
      $shade2 = New-Object System.Drawing.Drawing2D.LinearGradientBrush ((New-Object System.Drawing.Point ($x0 + $artW), 0), (New-Object System.Drawing.Point $skyW, 0), [System.Drawing.Color]::FromArgb(0, $gc.R, $gc.G, $gc.B), [System.Drawing.Color]::FromArgb(235, $gc.R, $gc.G, $gc.B))
      $g.FillRectangle($shade2, $x0 + $artW, 0, $x0, $skyH)
      # soften the join into the ground colour
      $fade = New-Object System.Drawing.Drawing2D.LinearGradientBrush ((New-Object System.Drawing.Point 0, ($horizon - 70)), (New-Object System.Drawing.Point 0, ($horizon + 4)), [System.Drawing.Color]::FromArgb(0, $gc.R, $gc.G, $gc.B), [System.Drawing.Color]::FromArgb(255, $gc.R, $gc.G, $gc.B))
      $g.FillRectangle($fade, 0, $horizon - 70, $skyW, 74)
      $g.Dispose()
      Save-Jpeg $c (Join-Path $vd 'backdrop.jpg') 86
      "backdrop $v (horizon row $hz of $($b.Height))"
      $c.Dispose(); $b.Dispose()
    }
  }

  # floor: one tile of the 4x2 sheet, margin trimmed, made seamless
  $fp = Join-Path $src 'arenas/floors/floors.png'
  if ((Test-Path $fp) -and $a.floor -ge 0) {
    $fs = Open-Bmp $fp
    $tw = [int]($fs.Width / 4); $th = [int]($fs.Height / 2); $m = 10
    $col = $a.floor % 4; $row = [math]::Floor($a.floor / 4)
    $n = [math]::Min($tw, $th) - 2 * $m
    $tile = New-Object System.Drawing.Bitmap $n, $n, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $tg = [System.Drawing.Graphics]::FromImage($tile)
    $tg.DrawImage($fs, (New-Object System.Drawing.Rectangle 0, 0, $n, $n), (New-Object System.Drawing.Rectangle ($col * $tw + $m), ($row * $th + $m), $n, $n), 'Pixel')
    $tg.Dispose()
    $seam = [ArtCut]::Seamless($tile)
    $seam.Save((Join-Path $vd 'floor.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    "floor $v $n"
    $seam.Dispose(); $tile.Dispose(); $fs.Dispose()
  }

  # props: nine objects of a 3x3 sheet, named p0..p8 in reading order
  if ($a.props) {
    $pp = Join-Path $src "arenas/props/$($a.props).png"
    if (Test-Path $pp) {
      $sheet = Open-Bmp $pp
      $keyed = Key-Sheet $sheet 26 14
      $cells = [ArtCut]::Cells($keyed, 3, 3)
      for ($i = 0; $i -lt 9; $i++) {
        if ($null -eq $cells[$i]) { Write-Warning "$($a.props) props: cell $i is empty"; continue }
        $o = Scale-To $cells[$i] 520 520
        $o.Save((Join-Path $vd "props/p$i.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        "prop $v p$i $($o.Width)x$($o.Height)"; $o.Dispose()
      }
      $sheet.Dispose()
    }
  }
}
& (Join-Path $PSScriptRoot 'pack-manifest.ps1')
