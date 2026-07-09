import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useInterpolatedProgress } from '../useInterpolatedProgress';

describe('useInterpolatedProgress', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기엔 서버값을 그대로 반환한다', () => {
    const { result } = renderHook(() => useInterpolatedProgress(30, true));
    expect(result.current).toBe(30);
  });

  it('서버값이 오르면 스냅업하고, 작은 하락엔 뒤로 가지 않는다', () => {
    const { result, rerender } = renderHook(
      ({ real, active }) => useInterpolatedProgress(real, active),
      { initialProps: { real: 30, active: true } }
    );
    rerender({ real: 50, active: true });
    expect(result.current).toBe(50);
    rerender({ real: 48, active: true }); // 작은 하락 → 유지(뒤로 안 감)
    expect(result.current).toBe(50);
  });

  it('완료(≥100)면 100으로 스냅한다', () => {
    const { result, rerender } = renderHook(
      ({ real, active }) => useInterpolatedProgress(real, active),
      { initialProps: { real: 58, active: true } }
    );
    rerender({ real: 100, active: false });
    expect(result.current).toBe(100);
  });

  it('큰 하락(재전사/새 세션)엔 리셋한다', () => {
    const { result, rerender } = renderHook(
      ({ real, active }) => useInterpolatedProgress(real, active),
      { initialProps: { real: 58, active: true } }
    );
    expect(result.current).toBe(58);
    rerender({ real: 5, active: true }); // 큰 하락 → 리셋
    expect(result.current).toBe(5);
  });

  it('처리 중엔 폴링 사이에도 다음 값을 향해 트리클한다(실제값+margin 이내)', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useInterpolatedProgress(30, true));
    expect(result.current).toBe(30);
    act(() => {
      vi.advanceTimersByTime(4000); // 여러 틱
    });
    expect(result.current).toBeGreaterThan(30);
    expect(result.current).toBeLessThanOrEqual(36); // real(30) + margin(6)
  });

  it('비활성이면 트리클하지 않는다', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useInterpolatedProgress(100, false));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current).toBe(100);
  });
});
