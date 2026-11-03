import { describe, expect, it } from 'vitest';
import { isSoftwareRenderer } from './renderer';

// (DECISIONS #573: the Low suggestion is shown only when the browser draws without the graphics card)
describe('software renderer check', () => {
  it('knows the software renderers', () => {
    for (const name of [
      'ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
    ])
      expect(isSoftwareRenderer(name), name).toBe(true);
  });

  it('does not take a graphics card for one, nor a name the browser hides', () => {
    for (const name of [
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 (0x00002786) Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'Apple M2',
      'AMD Custom GPU 0405 (radeonsi, vangogh, LLVM 15.0.7, DRM 3.49)',
      'hidden by the browser',
    ])
      expect(isSoftwareRenderer(name), name).toBe(false);
  });
});
