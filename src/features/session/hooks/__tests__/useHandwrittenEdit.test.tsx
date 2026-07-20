import type { PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sessionQueryKeys } from '@/shared/constants/queryKeys';

import { useHandwrittenEdit } from '../useHandwrittenEdit';

const mocks = vi.hoisted(() => ({
  updateHandwrittenTranscript: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/shared/api/server/transcriptServerApi', () => ({
  updateHandwrittenTranscript: mocks.updateHandwrittenTranscript,
}));

vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ userId: null }) },
}));

const content = (label: string) => label.repeat(120);

const detail = (sessionId: string, contents: string) => ({
  session: { id: sessionId },
  transcribe: {
    id: `h-${sessionId}`,
    session_id: sessionId,
    revision: 1,
    contents_md5: sessionId.toLowerCase().repeat(32).slice(0, 32),
    contents,
  },
  progressNotes: [],
});

describe('useHandwrittenEdit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mocks.updateHandwrittenTranscript.mockResolvedValue({
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
    const originalA = content('A');
    const originalB = content('B');
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', originalA)
    );
    queryClient.setQueryData(
      sessionQueryKeys.detail('B', false),
      detail('B', originalB)
    );

    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId, initialContent, fingerprint }) =>
        useHandwrittenEdit({
          sessionId,
          transcribeId,
          revision: 1,
          contentsFingerprint: fingerprint,
          initialContent,
          isDummySession: false,
          isReadOnly: false,
        }),
      {
        wrapper,
        initialProps: {
          sessionId: 'A',
          transcribeId: 'h-A',
          initialContent: originalA,
          fingerprint: 'a'.repeat(32),
        },
      }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleContentChange(content('수정')));
    rerender({
      sessionId: 'B',
      transcribeId: 'h-B',
      initialContent: originalB,
      fingerprint: 'b'.repeat(32),
    });
    await waitFor(() => expect(result.current.isEditing).toBe(false));
    await act(async () => result.current.handleSave());

    expect(mocks.updateHandwrittenTranscript).not.toHaveBeenCalled();
    const cachedB = queryClient.getQueryData(
      sessionQueryKeys.detail('B', false)
    ) as ReturnType<typeof detail>;
    expect(cachedB.transcribe.contents).toBe(originalB);
  });

  it('변경이 없으면 저장 요청 없이 편집 상태를 종료해야 합니다.', async () => {
    const original = content('A');
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', original)
    );
    const { result } = renderHook(
      () =>
        useHandwrittenEdit({
          sessionId: 'A',
          transcribeId: 'h-A',
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          initialContent: original,
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    await act(async () => result.current.handleSave());

    expect(mocks.updateHandwrittenTranscript).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editContent).toBe('');
  });

  it('편집 시작 시점의 target과 CAS 값으로 저장해야 합니다.', async () => {
    const original = content('A');
    const edited = content('수정');
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', original)
    );
    const { result } = renderHook(
      () =>
        useHandwrittenEdit({
          sessionId: 'A',
          transcribeId: 'h-A',
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          initialContent: original,
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleContentChange(edited));
    await act(async () => result.current.handleSave());

    expect(mocks.updateHandwrittenTranscript).toHaveBeenCalledWith({
      sessionId: 'A',
      transcribeId: 'h-A',
      expectedRevision: 1,
      expectedContentsFingerprint: 'a'.repeat(32),
      baseContents: original,
      contents: edited,
    });
  });

  it('저장 버튼을 연속으로 눌러도 요청은 한 번만 보내야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateHandwrittenTranscript.mockReturnValueOnce(pending.promise);
    const original = content('A');
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', original)
    );
    const { result } = renderHook(
      () =>
        useHandwrittenEdit({
          sessionId: 'A',
          transcribeId: 'h-A',
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          initialContent: original,
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleContentChange(content('수정')));
    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.handleSave();
      second = result.current.handleSave();
    });

    expect(mocks.updateHandwrittenTranscript).toHaveBeenCalledTimes(1);
    pending.resolve({ revision: 2, contentsFingerprint: 'd'.repeat(32) });
    await act(async () => Promise.all([first, second]));
  });

  it('저장 중에는 본문 변경과 취소를 받아들이지 않아야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateHandwrittenTranscript.mockReturnValueOnce(pending.promise);
    const original = content('A');
    const submitted = content('전송');
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', original)
    );
    const { result } = renderHook(
      () =>
        useHandwrittenEdit({
          sessionId: 'A',
          transcribeId: 'h-A',
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          initialContent: original,
          isDummySession: false,
          isReadOnly: false,
        }),
      { wrapper }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleContentChange(submitted));
    let save!: Promise<void>;
    act(() => {
      save = result.current.handleSave();
    });
    await waitFor(() => expect(result.current.isSaving).toBe(true));

    act(() => result.current.handleContentChange(content('유실 위험')));
    expect(result.current.editContent).toBe(submitted);
    expect(result.current.handleCancel()).toBe(false);
    expect(result.current.isEditing).toBe(true);

    pending.resolve({ revision: 2, contentsFingerprint: '9'.repeat(32) });
    await act(async () => save);
    expect(mocks.updateHandwrittenTranscript).toHaveBeenCalledWith(
      expect.objectContaining({ contents: submitted })
    );
  });

  it('A 저장 중 같은 A로 돌아와 새 편집을 시작하지 못해야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateHandwrittenTranscript.mockReturnValueOnce(pending.promise);
    const originalA = content('A');
    const originalB = content('B');
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', originalA)
    );
    queryClient.setQueryData(
      sessionQueryKeys.detail('B', false),
      detail('B', originalB)
    );

    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId, initialContent, fingerprint }) =>
        useHandwrittenEdit({
          sessionId,
          transcribeId,
          revision: 1,
          contentsFingerprint: fingerprint,
          initialContent,
          isDummySession: false,
          isReadOnly: false,
        }),
      {
        wrapper,
        initialProps: {
          sessionId: 'A',
          transcribeId: 'h-A',
          initialContent: originalA,
          fingerprint: 'a'.repeat(32),
        },
      }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleContentChange(content('A수정')));
    let saveA!: Promise<void>;
    act(() => {
      saveA = result.current.handleSave();
    });
    await waitFor(() => expect(result.current.isSaving).toBe(true));

    rerender({
      sessionId: 'B',
      transcribeId: 'h-B',
      initialContent: originalB,
      fingerprint: 'b'.repeat(32),
    });
    rerender({
      sessionId: 'A',
      transcribeId: 'h-A',
      initialContent: originalA,
      fingerprint: 'a'.repeat(32),
    });
    act(() => result.current.handleEditStart());

    expect(result.current.isEditing).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '저장 중이에요' })
    );

    pending.resolve({ revision: 2, contentsFingerprint: 'f'.repeat(32) });
    await act(async () => saveA);
  });

  it('A의 늦은 저장 응답이 B의 새 편집을 지우지 않아야 합니다.', async () => {
    const pending = deferred<{
      revision: number;
      contentsFingerprint: string;
    }>();
    mocks.updateHandwrittenTranscript.mockReturnValueOnce(pending.promise);
    const originalA = content('A');
    const originalB = content('B');
    queryClient.setQueryData(
      sessionQueryKeys.detail('A', false),
      detail('A', originalA)
    );
    queryClient.setQueryData(
      sessionQueryKeys.detail('B', false),
      detail('B', originalB)
    );

    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId, initialContent, fingerprint }) =>
        useHandwrittenEdit({
          sessionId,
          transcribeId,
          revision: 1,
          contentsFingerprint: fingerprint,
          initialContent,
          isDummySession: false,
          isReadOnly: false,
        }),
      {
        wrapper,
        initialProps: {
          sessionId: 'A',
          transcribeId: 'h-A',
          initialContent: originalA,
          fingerprint: 'a'.repeat(32),
        },
      }
    );

    act(() => result.current.handleEditStart());
    act(() => result.current.handleContentChange(content('A수정')));
    let saveA!: Promise<void>;
    act(() => {
      saveA = result.current.handleSave();
    });
    expect(mocks.updateHandwrittenTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'A',
        transcribeId: 'h-A',
        baseContents: originalA,
      })
    );
    rerender({
      sessionId: 'B',
      transcribeId: 'h-B',
      initialContent: originalB,
      fingerprint: 'b'.repeat(32),
    });
    act(() => result.current.handleEditStart());
    act(() => result.current.handleContentChange(content('B수정')));

    pending.resolve({ revision: 2, contentsFingerprint: 'e'.repeat(32) });
    await act(async () => saveA);

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editContent).toBe(content('B수정'));
  });
});
