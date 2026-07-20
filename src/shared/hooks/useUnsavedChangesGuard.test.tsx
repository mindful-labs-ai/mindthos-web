import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

const mocks = vi.hoisted(() => ({
  useBlocker: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useBlocker: mocks.useBlocker,
}));

describe('useUnsavedChangesGuard', () => {
  let blocker: {
    state: 'unblocked' | 'blocked';
    proceed: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    blocker = {
      state: 'unblocked',
      proceed: vi.fn(),
      reset: vi.fn(),
    };
    mocks.useBlocker.mockImplementation(() => blocker);
  });

  it('browserHistoryOnly이면 앱 내부 이동은 허용하고 브라우저 POP만 확인합니다.', () => {
    const onDiscard = vi.fn(() => true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { rerender } = renderHook(() =>
      useUnsavedChangesGuard(() => true, '편집 내용을 초기화할까요?', {
        browserHistoryOnly: true,
        onDiscard,
      })
    );
    const shouldBlock = mocks.useBlocker.mock.calls.at(-1)?.[0] as (args: {
      historyAction: string;
    }) => boolean;

    expect(shouldBlock({ historyAction: 'PUSH' })).toBe(false);

    act(() => {
      expect(shouldBlock({ historyAction: 'POP' })).toBe(true);
    });
    blocker = { ...blocker, state: 'blocked' };
    rerender();

    expect(window.confirm).toHaveBeenCalledWith('편집 내용을 초기화할까요?');
    expect(onDiscard).toHaveBeenCalledOnce();
    expect(blocker.proceed).toHaveBeenCalledOnce();
  });

  it('편집 상태를 초기화할 수 없으면 브라우저 이동을 취소합니다.', () => {
    const onDiscard = vi.fn(() => false);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { rerender } = renderHook(() =>
      useUnsavedChangesGuard(() => true, '편집 내용을 초기화할까요?', {
        browserHistoryOnly: true,
        onDiscard,
      })
    );
    const shouldBlock = mocks.useBlocker.mock.calls.at(-1)?.[0] as (args: {
      historyAction: string;
    }) => boolean;

    act(() => {
      expect(shouldBlock({ historyAction: 'POP' })).toBe(true);
    });
    blocker = { ...blocker, state: 'blocked' };
    rerender();

    expect(onDiscard).toHaveBeenCalledOnce();
    expect(blocker.proceed).not.toHaveBeenCalled();
    expect(blocker.reset).toHaveBeenCalledOnce();
  });
});
