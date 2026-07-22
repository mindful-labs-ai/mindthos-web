import type { PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSegments } from '@/features/session/utils/contentsEditor';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';

import { useTranscriptEditSession } from '../useTranscriptEditSession';

const mocks = vi.hoisted(() => ({
  updateTranscript: vi.fn(),
  toast: vi.fn(),
  trackEvent: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock('@/shared/api/server/transcriptServerApi', () => ({
  updateTranscript: mocks.updateTranscript,
}));

vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/lib/mixpanel', () => ({
  trackEvent: mocks.trackEvent,
  trackError: mocks.trackError,
}));

const detail = (sessionId: string, text: string) => ({
  session: { id: sessionId },
  transcribe: {
    id: `t-${sessionId}`,
    session_id: sessionId,
    revision: 1,
    contents_md5: `${sessionId.toLowerCase().repeat(32).slice(0, 32)}`,
    contents: {
      language: 'ko',
      segments: [{ id: 1, start: 0, end: 1, speaker: 0, text }],
      text,
      raw_output: `raw-${sessionId}`,
      stt_model: 'basic',
    },
  },
  progressNotes: [],
});

describe('useTranscriptEditSession', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mocks.updateTranscript.mockResolvedValue({
      revision: 2,
      contentsFingerprint: 'c'.repeat(32),
    });
  });

  function wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((resolvePromise) => {
      resolve = resolvePromise;
    });
    return { promise, resolve };
  }

  it('A 편집 중 B로 이동한 뒤 저장해도 B를 갱신하지 않아야 합니다.', async () => {
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );
    queryClient.setQueryData(
      sessionQueryKeys.detail('B', false),
      detail('B', 'B 원문')
    );

    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId }) =>
        useTranscriptEditSession({
          sessionId,
          transcribeId,
          isDummySession: false,
          isReadOnly: false,
        }),
      {
        wrapper,
        initialProps: { sessionId: 'A', transcribeId: 't-A' },
      }
    );

    act(() => {
      result.current.handleEditStart();
    });
    act(() => {
      result.current.handleTextEdit(1, 'A 수정본');
    });

    rerender({ sessionId: 'B', transcribeId: 't-B' });

    await waitFor(() => {
      expect(result.current.isEditing).toBe(false);
      expect(result.current.editingContents).toBeNull();
    });

    await act(async () => {
      await result.current.handleSaveAllEdits();
    });

    expect(mocks.updateTranscript).not.toHaveBeenCalled();
    const cachedB = queryClient.getQueryData(
      sessionQueryKeys.detail('B', false)
    ) as ReturnType<typeof detail>;
    expect(cachedB.transcribe.contents.segments[0].text).toBe('B 원문');
  });

  it('변경이 없으면 저장 요청을 보내지 않아야 합니다.', async () => {
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );

    const { result } = renderHook(
      () =>
        useTranscriptEditSession({
          sessionId: 'A',
          transcribeId: 't-A',
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    await act(async () => result.current.handleSaveAllEdits());

    expect(mocks.updateTranscript).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  it('편집 시작 시점의 대상과 버전으로만 저장해야 합니다.', async () => {
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );

    const { result } = renderHook(
      () =>
        useTranscriptEditSession({
          sessionId: 'A',
          transcribeId: 't-A',
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleTextEdit(1, 'A 수정본'));
    await act(async () => result.current.handleSaveAllEdits());

    expect(mocks.updateTranscript).toHaveBeenCalledTimes(1);
    expect(mocks.updateTranscript).toHaveBeenCalledWith({
      sessionId: 'A',
      transcribeId: 't-A',
      expectedRevision: 1,
      expectedContentsFingerprint: 'a'.repeat(32),
      baseContents: expect.objectContaining({
        raw_output: 'raw-A',
        segments: [expect.objectContaining({ id: 1, text: 'A 원문' })],
      }),
      contents: expect.objectContaining({
        raw_output: 'raw-A',
        segments: [expect.objectContaining({ id: 1, text: 'A 수정본' })],
      }),
    });

    const cachedA = queryClient.getQueryData(
      sessionQueryKeys.detail('A', false)
    ) as ReturnType<typeof detail>;
    expect(cachedA.transcribe.revision).toBe(2);
    expect(cachedA.transcribe.contents_md5).toBe('c'.repeat(32));
  });

  it('A 저장 응답이 늦게 와도 B에서 새로 시작한 편집을 지우지 않아야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateTranscript.mockReturnValueOnce(pending.promise);
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );
    queryClient.setQueryData(
      sessionQueryKeys.detail('B', false),
      detail('B', 'B 원문')
    );

    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId }) =>
        useTranscriptEditSession({
          sessionId,
          transcribeId,
          isDummySession: false,
          isReadOnly: false,
        }),
      {
        wrapper,
        initialProps: { sessionId: 'A', transcribeId: 't-A' },
      }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleTextEdit(1, 'A 수정본'));
    let saveA!: Promise<void>;
    act(() => {
      saveA = result.current.handleSaveAllEdits();
    });
    await waitFor(() =>
      expect(mocks.updateTranscript).toHaveBeenCalledTimes(1)
    );
    expect(mocks.updateTranscript.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        sessionId: 'A',
        transcribeId: 't-A',
        baseContents: expect.objectContaining({
          raw_output: 'raw-A',
          segments: [expect.objectContaining({ text: 'A 원문' })],
        }),
      })
    );

    rerender({ sessionId: 'B', transcribeId: 't-B' });
    act(() => result.current.handleEditStart());
    act(() => result.current.handleTextEdit(1, 'B 수정본'));
    expect(result.current.isEditing).toBe(true);
    expect(result.current.hasEdits).toBe(true);

    pending.resolve({
      revision: 2,
      contentsFingerprint: 'd'.repeat(32),
    });
    await act(async () => saveA);

    expect(result.current.isEditing).toBe(true);
    expect(result.current.hasEdits).toBe(true);
    expect(result.current.editingContents).not.toBeNull();
  });

  it('저장 버튼을 연속으로 눌러도 요청은 한 번만 보내야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateTranscript.mockReturnValueOnce(pending.promise);
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );

    const { result } = renderHook(
      () =>
        useTranscriptEditSession({
          sessionId: 'A',
          transcribeId: 't-A',
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleTextEdit(1, 'A 수정본'));
    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.handleSaveAllEdits();
      second = result.current.handleSaveAllEdits();
    });

    expect(mocks.updateTranscript).toHaveBeenCalledTimes(1);
    pending.resolve({
      revision: 2,
      contentsFingerprint: 'e'.repeat(32),
    });
    await act(async () => Promise.all([first, second]));
  });

  it('저장 중에는 추가 편집과 취소를 받아들이지 않아야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateTranscript.mockReturnValueOnce(pending.promise);
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );
    const { result } = renderHook(
      () =>
        useTranscriptEditSession({
          sessionId: 'A',
          transcribeId: 't-A',
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleTextEdit(1, '전송할 수정본'));
    let save!: Promise<void>;
    act(() => {
      save = result.current.handleSaveAllEdits();
    });
    await waitFor(() => expect(result.current.isSaving).toBe(true));

    act(() => {
      result.current.handleAddSegment(1, 0);
      result.current.handleTextEdit(1, '전송 뒤 입력한 유실 위험 내용');
    });
    expect(getSegments(result.current.editingContents!)).toHaveLength(1);
    expect(result.current.handleCancelEdit()).toBe(false);
    expect(result.current.isEditing).toBe(true);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '저장 중이에요' })
    );

    pending.resolve({ revision: 2, contentsFingerprint: '9'.repeat(32) });
    await act(async () => save);
    expect(mocks.updateTranscript.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        contents: expect.objectContaining({
          segments: [expect.objectContaining({ text: '전송할 수정본' })],
        }),
      })
    );
  });

  it('A 저장 중 같은 A로 돌아와 새 편집을 시작하지 못해야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateTranscript.mockReturnValueOnce(pending.promise);
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );
    queryClient.setQueryData(
      sessionQueryKeys.detail('B', false),
      detail('B', 'B 원문')
    );

    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId }) =>
        useTranscriptEditSession({
          sessionId,
          transcribeId,
          isDummySession: false,
          isReadOnly: false,
        }),
      {
        wrapper,
        initialProps: { sessionId: 'A', transcribeId: 't-A' },
      }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleTextEdit(1, 'A 수정본'));
    let saveA!: Promise<void>;
    act(() => {
      saveA = result.current.handleSaveAllEdits();
    });
    await waitFor(() => expect(result.current.isSaving).toBe(true));

    rerender({ sessionId: 'B', transcribeId: 't-B' });
    rerender({ sessionId: 'A', transcribeId: 't-A' });
    act(() => result.current.handleEditStart());

    expect(result.current.isEditing).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '저장 중이에요' })
    );

    pending.resolve({
      revision: 2,
      contentsFingerprint: 'f'.repeat(32),
    });
    await act(async () => saveA);
  });

  it('비편집 화자 변경 성공 후 상세 캐시를 다시 조회해야 합니다.', async () => {
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', 'A 원문')
    );
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () =>
        useTranscriptEditSession({
          sessionId: 'A',
          transcribeId: 't-A',
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSpeakerChange({
        speakerChanges: { 1: 1 },
        speakerDefinitions: [
          { id: 0, role: 'counselor' },
          { id: 1, role: 'client1' },
        ],
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sessionQueryKeys.detail('A', false),
    });
  });
});
