import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTabNavigation } from '../useTabNavigation';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/lib/mixpanel', () => ({ trackEvent: mocks.trackEvent }));

describe('useTabNavigation', () => {
  beforeEach(() => vi.clearAllMocks());

  const contentScrollRef = { current: null };

  it('저장 중에는 다른 탭으로 이동하지 않아야 합니다.', () => {
    const setActiveTab = vi.fn();
    const { result } = renderHook(() =>
      useTabNavigation({
        activeTab: 'transcript',
        setActiveTab,
        isEditing: true,
        isSaving: true,
        onCancelEdit: () => false,
        setCreatingTabs: vi.fn(),
        contentScrollRef,
      })
    );

    act(() => result.current.handleTabChange('note-1'));

    expect(setActiveTab).not.toHaveBeenCalled();
    expect(result.current.isTabChangeModalOpen).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '저장 중이에요' })
    );
  });

  it('취소 핸들러가 저장 중이라며 거절하면 확인 후에도 이동하지 않아야 합니다.', () => {
    const setActiveTab = vi.fn();
    const { result } = renderHook(() =>
      useTabNavigation({
        activeTab: 'transcript',
        setActiveTab,
        isEditing: true,
        onCancelEdit: () => false,
        setCreatingTabs: vi.fn(),
        contentScrollRef,
      })
    );

    act(() => result.current.handleTabChange('note-1'));
    expect(result.current.isTabChangeModalOpen).toBe(true);
    act(() => result.current.handleConfirmTabChange());

    expect(setActiveTab).not.toHaveBeenCalled();
    expect(result.current.isTabChangeModalOpen).toBe(true);
  });
});
