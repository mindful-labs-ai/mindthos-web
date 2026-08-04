import { describe, expect, it, vi } from 'vitest';

import { markPreloadRecovery } from './preloadErrorRecovery';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

describe('preload error recovery', () => {
  it('첫 preload 실패를 자동 복구 대상으로 표시한다', () => {
    const storage = createStorage();

    expect(markPreloadRecovery(storage, 100_000)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      'mindthos:preload-recovery-at',
      '100000'
    );
  });

  it('30초 안의 반복 실패는 reload loop를 막는다', () => {
    const storage = createStorage();

    expect(markPreloadRecovery(storage, 100_000)).toBe(true);
    expect(markPreloadRecovery(storage, 129_999)).toBe(false);
    expect(markPreloadRecovery(storage, 130_000)).toBe(true);
  });

  it('sessionStorage를 사용할 수 없어도 한 번의 복구는 허용한다', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('storage unavailable');
      }),
      setItem: vi.fn(),
    };

    expect(markPreloadRecovery(storage, 100_000)).toBe(true);
  });
});
