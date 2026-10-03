import { describe, expect, it } from 'vitest';
import { INT32_MAX, clampInt } from './numbers';

describe('clampInt', () => {
  it('limits to the C# int range and truncates', () => {
    expect(clampInt(5_000_000_000)).toBe(INT32_MAX);
    expect(clampInt(-3)).toBe(0);
    expect(clampInt(12.9)).toBe(12);
    expect(clampInt(250, 1, 100)).toBe(100);
    expect(clampInt(NaN, 1)).toBe(1);
  });
});
