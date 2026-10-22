import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@sr/engine';
import { AI_ENGINE_VERSION } from './index';

describe('@sr/ai', () => {
  it('resolves the engine workspace package', () => {
    expect(AI_ENGINE_VERSION).toBe(ENGINE_VERSION);
  });
});
