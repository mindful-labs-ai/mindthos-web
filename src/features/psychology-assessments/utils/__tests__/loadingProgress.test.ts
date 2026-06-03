import { describe, expect, it } from 'vitest';

import { toLoadingDisplayPercent } from '../loadingProgress';

describe('toLoadingDisplayPercent', () => {
  it('starts active loading at 10%', () => {
    expect(toLoadingDisplayPercent(0, 'start')).toBe(10);
  });

  it('keeps completed loading at 100%', () => {
    expect(toLoadingDisplayPercent(100, 'done')).toBe(100);
  });

  it('maps raw progress into the remaining 90% with bounded jitter', () => {
    const raw = 33;
    const baseline = 10 + raw * 0.9;
    const actual = toLoadingDisplayPercent(raw, 'middle');

    expect(actual).toBeGreaterThanOrEqual(Math.round(baseline - 3));
    expect(actual).toBeLessThanOrEqual(Math.round(baseline + 3));
  });

  it('does not show 100% before completion', () => {
    expect(toLoadingDisplayPercent(99, 'almost-done')).toBeLessThan(100);
  });
});
