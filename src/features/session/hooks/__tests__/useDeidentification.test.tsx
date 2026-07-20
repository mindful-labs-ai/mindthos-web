import type { PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  creditQueryKeys,
  sessionQueryKeys,
} from '@/shared/constants/queryKeys';

import { useDeidentification } from '../useDeidentification';

const mocks = vi.hoisted(() => ({
  deidentifyTranscript: vi.fn(),
  checkCredit: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/shared/api/server/transcriptServerApi', () => ({
  deidentifyTranscript: mocks.deidentifyTranscript,
}));

vi.mock('@/shared/hooks/useCreditGuard', () => ({
  useCreditGuard: () => mocks.checkCredit,
}));

vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/widgets/session/DeidentificationModal', () => ({
  DeidentificationModal: ({
    open,
    onConfirm,
    phase,
    errorMessage,
  }: {
    open: boolean;
    onConfirm: () => void;
    phase: string;
    errorMessage: string;
  }) =>
    open ? (
      <div>
        <button type="button" onClick={onConfirm}>
          confirm-deid
        </button>
        <span>{phase}</span>
        <span>{errorMessage}</span>
      </div>
    ) : null,
}));

describe('useDeidentification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mocks.checkCredit.mockResolvedValue({ ok: true, remaining: 100 });
    mocks.deidentifyTranscript.mockResolvedValue({
      success: true,
      session_id: 'session-a',
      stats: {
        total_segments: 2,
        deid_segments: 1,
        deid_tags: 1,
        consistency_rate: 100,
        nv_preserve_rate: 100,
      },
      revision: 2,
      contents_fingerprint: 'b'.repeat(32),
    });
  });

  function wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  async function confirm(result: {
    current: ReturnType<typeof useDeidentification>;
  }) {
    act(() => result.current.handleDeidentify());
    const modal = render(result.current.deidModal, { wrapper });
    await act(async () => {
      fireEvent.click(modal.getByRole('button', { name: 'confirm-deid' }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return modal;
  }

  it('Edge payload 없이 화면이 본 transcript snapshot으로 server command를 호출해야 합니다.', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useDeidentification({
          sessionId: 'session-a',
          transcribeId: 'transcribe-a',
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          userId: 7,
          segments: [],
          onSuccess,
        }),
      { wrapper }
    );

    await confirm(result);

    await waitFor(() =>
      expect(mocks.deidentifyTranscript).toHaveBeenCalledWith({
        sessionId: 'session-a',
        transcribeId: 'transcribe-a',
        expectedRevision: 1,
        expectedContentsFingerprint: 'a'.repeat(32),
      })
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('일반 5xx를 credit pending으로 오인하지 않고 transcript cache를 다시 읽어야 합니다.', async () => {
    mocks.deidentifyTranscript.mockRejectedValue({
      status: 503,
      statusCode: 'SERVER_ERROR',
      message: '비식별화 AI가 설정되지 않았어요.',
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () =>
        useDeidentification({
          sessionId: 'session-a',
          transcribeId: 'transcribe-a',
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          userId: 7,
          segments: [],
        }),
      { wrapper }
    );

    const modal = await confirm(result);

    await waitFor(() =>
      expect(mocks.deidentifyTranscript).toHaveBeenCalledTimes(1)
    );
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    modal.rerender(result.current.deidModal);
    expect(
      modal.getByText('처리 결과를 확인할 수 없어 최신 내용을 다시 불러왔어요.')
    ).toBeTruthy();
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sessions'] })
    );
  });

  it('credit 확인 중 대상 세션이 바뀌면 이전 대상 요청과 UI 반영을 중단해야 합니다.', async () => {
    let resolveGuard!: (value: { ok: true; remaining: number }) => void;
    mocks.checkCredit.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGuard = resolve;
      })
    );
    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId }) =>
        useDeidentification({
          sessionId,
          transcribeId,
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          userId: 7,
          segments: [],
        }),
      {
        wrapper,
        initialProps: {
          sessionId: 'session-a',
          transcribeId: 'transcribe-a',
        },
      }
    );

    act(() => result.current.handleDeidentify());
    const modal = render(result.current.deidModal, { wrapper });
    act(() => {
      fireEvent.click(modal.getByRole('button', { name: 'confirm-deid' }));
    });
    expect(mocks.checkCredit).toHaveBeenCalledTimes(1);

    rerender({ sessionId: 'session-b', transcribeId: 'transcribe-b' });
    await act(async () => {
      resolveGuard({ ok: true, remaining: 100 });
      await Promise.resolve();
    });

    expect(mocks.deidentifyTranscript).not.toHaveBeenCalled();
    modal.rerender(result.current.deidModal);
    expect(modal.queryByRole('button', { name: 'confirm-deid' })).toBeNull();
  });

  it('server command 전송 후 대상이 바뀌어도 원래 대상 cache와 credit은 재조정해야 합니다.', async () => {
    let resolveCommand!: (value: {
      success: boolean;
      session_id: string;
      stats: {
        total_segments: number;
        deid_segments: number;
        deid_tags: number;
        consistency_rate: number;
        nv_preserve_rate: number;
      };
      revision: number;
      contents_fingerprint: string;
    }) => void;
    mocks.deidentifyTranscript.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCommand = resolve;
      })
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onSuccess = vi.fn();
    const { result, rerender } = renderHook(
      ({ sessionId, transcribeId }) =>
        useDeidentification({
          sessionId,
          transcribeId,
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          userId: 7,
          segments: [],
          onSuccess,
        }),
      {
        wrapper,
        initialProps: {
          sessionId: 'session-a',
          transcribeId: 'transcribe-a',
        },
      }
    );

    await confirm(result);
    await waitFor(() =>
      expect(mocks.deidentifyTranscript).toHaveBeenCalledTimes(1)
    );
    rerender({ sessionId: 'session-b', transcribeId: 'transcribe-b' });
    await act(async () => {
      resolveCommand({
        success: true,
        session_id: 'session-a',
        stats: {
          total_segments: 2,
          deid_segments: 1,
          deid_tags: 1,
          consistency_rate: 100,
          nv_preserve_rate: 100,
        },
        revision: 2,
        contents_fingerprint: 'b'.repeat(32),
      });
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: sessionQueryKeys.detail('session-a', false),
      })
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['sessions'] });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: creditQueryKeys.summary(7),
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('credit preflight 중 확인을 연속 클릭해도 server command는 한 번만 보내야 합니다.', async () => {
    let resolveGuard!: (value: { ok: true; remaining: number }) => void;
    mocks.checkCredit.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGuard = resolve;
      })
    );
    const { result } = renderHook(
      () =>
        useDeidentification({
          sessionId: 'session-a',
          transcribeId: 'transcribe-a',
          revision: 1,
          contentsFingerprint: 'a'.repeat(32),
          userId: 7,
          segments: [],
        }),
      { wrapper }
    );

    act(() => result.current.handleDeidentify());
    const modal = render(result.current.deidModal, { wrapper });
    act(() => {
      const confirmButton = modal.getByRole('button', {
        name: 'confirm-deid',
      });
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
    });

    expect(mocks.checkCredit).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveGuard({ ok: true, remaining: 100 });
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(mocks.deidentifyTranscript).toHaveBeenCalledTimes(1)
    );
  });
});
