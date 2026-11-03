// What the browser draws with (DECISIONS #573): the graphics card's name, and whether it is a software renderer (Windows'
// "Microsoft Basic Render Driver", Chrome's SwiftShader, Linux's llvmpipe), which a browser falls back to with hardware
// acceleration off or a graphics driver it will not use. Asked once; the answer does not change while the page is open.

let name: string | null = null;

/** The renderer the browser reports for WebGL, or a word for why there is none. */
export function rendererName(): string {
  if (name !== null) return name;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!gl) return (name = 'no WebGL');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'hidden by the browser';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    name = 'unknown';
  }
  return name;
}

/** Whether a renderer's name is a software renderer's. */
export const isSoftwareRenderer = (renderer: string): boolean =>
  /basic render|swiftshader|llvmpipe|softpipe|software|\bwarp\b/i.test(renderer);

/** True when the browser draws without the graphics card (a name it hides is taken as a graphics card). */
export const drawsInSoftware = (): boolean => isSoftwareRenderer(rendererName());
