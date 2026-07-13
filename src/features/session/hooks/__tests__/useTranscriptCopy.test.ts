import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Speaker, TranscribeSegment } from '../../types';
import { useTranscriptCopy } from '../useTranscriptCopy';

const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));
vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const writeText = vi.fn<(text: string) => Promise<void>>();

const speakers: Speaker[] = [
  { id: 0, role: 'counselor' },
  { id: 1, role: 'client1' },
];

const seg = (
  id: number,
  speaker: number,
  text: string,
  extra: Partial<Pick<TranscribeSegment, 'nv' | 'deid'>> = {}
): TranscribeSegment => ({ id, start: 0, end: 1, speaker, text, ...extra });

const copiedText = () => writeText.mock.calls.at(-1)?.[0];

describe('useTranscriptCopy.handleCopyTranscript', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    toastMock.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  it('화자명과 화자별 발언 번호로 포맷한다 (화자별 카운터 독립 누적)', async () => {
    const { result } = renderHook(() => useTranscriptCopy({ isReadOnly: false }));
    await act(() =>
      result.current.handleCopyTranscript(
        [seg(0, 0, '어서오세요'), seg(1, 1, '안녕하세요'), seg(2, 0, '오늘 어땠나요')],
        speakers,
        false
      )
    );
    expect(copiedText()).toBe(
      '상담사 #1 : 어서오세요\n내담자 #1 : 안녕하세요\n상담사 #2 : 오늘 어땠나요'
    );
  });

  it('익명화 모드에서는 화자명을 제외한다', async () => {
    const { result } = renderHook(() => useTranscriptCopy({ isReadOnly: false }));
    await act(() =>
      result.current.handleCopyTranscript([seg(0, 0, '안녕')], speakers, true)
    );
    expect(copiedText()).toBe('#1 : 안녕');
  });

  it('비언어 태그를 (라벨)로 치환한다 — advanced·legacy 모두', async () => {
    const { result } = renderHook(() => useTranscriptCopy({ isReadOnly: false }));
    await act(() =>
      result.current.handleCopyTranscript(
        [
          seg(0, 0, '⟪nv:a1⟫ 네', { nv: ['a1:한숨'] }),
          seg(1, 1, '{%S%} 그게요 {%A%}'),
        ],
        speakers,
        false
      )
    );
    expect(copiedText()).toBe(
      '상담사 #1 : (한숨) 네\n내담자 #1 : (침묵) 그게요 '
    );
  });

  it('deid: showDeid=true면 [라벨], false면 원본으로 치환한다', async () => {
    const segments = [
      seg(0, 1, '⟪deid:d1|정미연⟫ 씨가 왔다.', { deid: { d1: '인물1' } }),
    ];
    const { result } = renderHook(() => useTranscriptCopy({ isReadOnly: false }));

    await act(() =>
      result.current.handleCopyTranscript(segments, speakers, false, true)
    );
    expect(copiedText()).toBe('내담자 #1 : [인물1] 씨가 왔다.');

    await act(() =>
      result.current.handleCopyTranscript(segments, speakers, false, false)
    );
    expect(copiedText()).toBe('내담자 #1 : 정미연 씨가 왔다.');
  });

  it('읽기 전용이면 복사하지 않고 안내 토스트를 띄운다', async () => {
    const { result } = renderHook(() => useTranscriptCopy({ isReadOnly: true }));
    await act(() =>
      result.current.handleCopyTranscript([seg(0, 0, '안녕')], speakers, false)
    );
    expect(writeText).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: '읽기 전용' })
    );
  });

  it('클립보드 실패 시 실패 토스트를 띄운다', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useTranscriptCopy({ isReadOnly: false }));
    await act(() =>
      result.current.handleCopyTranscript([seg(0, 0, '안녕')], speakers, false)
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: '복사 실패 — 다시 시도해 주세요.' })
    );
  });
});
