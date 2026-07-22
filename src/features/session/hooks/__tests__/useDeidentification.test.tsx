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

import type { DeidentificationStatusResponse } from '@/shared/api/server/transcriptServerApi';
import {
  creditQueryKeys,
  sessionQueryKeys,
} from '@/shared/constants/queryKeys';

import { useDeidentification } from '../useDeidentification';

const mocks = vi.hoisted(() => ({
  deidentifyTranscript: vi.fn(),
  getDeidentificationStatus: vi.fn(),
  checkCredit: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/shared/api/server/transcriptServerApi', () => ({
  deidentifyTranscript: mocks.deidentifyTranscript,
  getDeidentificationStatus: mocks.getDeidentificationStatus,
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

const pendingStatus: DeidentificationStatusResponse = {
  id: 'deid-a',
  status: 'pending' as const,
  session_id: 'session-a',
  transcribe_id: 'transcribe-a',
};

const succeededStatus: DeidentificationStatusResponse = {
  ...pendingStatus,
  status: 'succeeded' as const,
  stats: {
    total_segments: 2,
    deid_segments: 1,
    deid_tags: 1,
    consistency_rate: 100,
    nv_preserve_rate: 100,
  },
  revision: 2,
  contents_fingerprint: 'b'.repeat(32),
};

describe('useDeidentification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mocks.checkCredit.mockResolvedValue({ ok: true, remaining: 100 });
    mocks.getDeidentificationStatus.mockResolvedValue(null);
    mocks.deidentifyTranscript.mockResolvedValue(pendingStatus);
  });

  function wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  function renderDeidentification(onSuccess = vi.fn()) {
    return {
      onSuccess,
      ...renderHook(
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
      ),
    };
  }

  async function confirm(result: {
    current: ReturnType<typeof useDeidentification>;
  }) {
    act(() => result.current.handleDeidentify());
    const modal = render(result.current.deidModal, { wrapper });
    await act(async () => {
      fireEvent.click(modal.getByRole('button', { name: 'confirm-deid' }));
      await Promise.resolve();
    });
    return modal;
  }

  async function setStatus(status: DeidentificationStatusResponse) {
    await act(async () => {
      queryClient.setQueryData(
        sessionQueryKeys.deidentificationStatus(
          status.session_id,
          status.transcribe_id
        ),
        status
      );
      await Promise.resolve();
    });
  }

  it('POST 202 직후에는 완료 처리하지 않고 status polling을 대기해야 합니다.', async () => {
    const { result, onSuccess } = renderDeidentification();
    await waitFor(() =>
      expect(mocks.getDeidentificationStatus).toHaveBeenCalledWith({
        sessionId: 'session-a',
        transcribeId: 'transcribe-a',
      })
    );

    const modal = await confirm(result);

    await waitFor(() =>
      expect(mocks.deidentifyTranscript).toHaveBeenCalledWith({
        sessionId: 'session-a',
        transcribeId: 'transcribe-a',
        expectedRevision: 1,
        expectedContentsFingerprint: 'a'.repeat(32),
      })
    );
    modal.rerender(result.current.deidModal);
    expect(modal.getByText('loading')).toBeTruthy();
    expect(result.current.showDeid).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('pending/processing에서는 대기하고 succeeded에서만 완료·cache 재조정을 수행해야 합니다.', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result, onSuccess } = renderDeidentification();
    await waitFor(() =>
      expect(mocks.getDeidentificationStatus).toHaveBeenCalledTimes(1)
    );
    const modal = await confirm(result);

    await setStatus({ ...pendingStatus, status: 'processing' });
    modal.rerender(result.current.deidModal);
    expect(modal.getByText('loading')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();

    await setStatus(succeededStatus);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    modal.rerender(result.current.deidModal);
    expect(modal.getByText('complete')).toBeTruthy();
    expect(result.current.showDeid).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: sessionQueryKeys.detail('session-a', false),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['sessions'] });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: creditQueryKeys.summary(7),
    });
  });

  it('failed status의 error_code를 오류 UI로 변환하고 폴링을 종료해야 합니다.', async () => {
    const { result, onSuccess } = renderDeidentification();
    await waitFor(() =>
      expect(mocks.getDeidentificationStatus).toHaveBeenCalledTimes(1)
    );
    const modal = await confirm(result);

    await setStatus({
      ...pendingStatus,
      status: 'failed',
      error_code: 'NO_DEID_TARGETS',
    });

    await waitFor(() => {
      modal.rerender(result.current.deidModal);
      expect(modal.getByText('error')).toBeTruthy();
    });
    expect(modal.getByText('NO_DEID_TARGETS')).toBeTruthy();
    expect(result.current.showDeid).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('POST 5xx는 작업 대기 상태로 오인하지 않고 cache를 재조정해야 합니다.', async () => {
    mocks.deidentifyTranscript.mockRejectedValue({
      status: 503,
      message: '비식별화 큐를 사용할 수 없어요.',
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderDeidentification();
    await waitFor(() =>
      expect(mocks.getDeidentificationStatus).toHaveBeenCalledTimes(1)
    );
    const modal = await confirm(result);

    await waitFor(() => {
      modal.rerender(result.current.deidModal);
      expect(
        modal.getByText(
          '처리 결과를 확인할 수 없어 최신 내용을 다시 불러왔어요.'
        )
      ).toBeTruthy();
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['sessions'] });
  });

  it('재진입 시 POST 없이 최신 pending status를 조회해 polling UI를 복구해야 합니다.', async () => {
    mocks.getDeidentificationStatus.mockResolvedValueOnce(pendingStatus);
    const { result, onSuccess } = renderDeidentification();
    const modal = render(result.current.deidModal, { wrapper });

    await waitFor(() => {
      modal.rerender(result.current.deidModal);
      expect(modal.getByText('loading')).toBeTruthy();
    });

    expect(mocks.deidentifyTranscript).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    await setStatus(succeededStatus);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    modal.rerender(result.current.deidModal);
    expect(modal.getByText('complete')).toBeTruthy();
  });

  it('재진입 시 처음부터 terminal인 과거 job은 오류 모달을 다시 열지 않아야 합니다.', async () => {
    const failedStatus: DeidentificationStatusResponse = {
      ...pendingStatus,
      status: 'failed',
      error_code: 'NO_DEID_TARGETS',
    };
    mocks.getDeidentificationStatus.mockResolvedValueOnce(failedStatus);
    const { result, onSuccess } = renderDeidentification();
    const modal = render(result.current.deidModal, { wrapper });

    await waitFor(() =>
      expect(
        queryClient.getQueryData(
          sessionQueryKeys.deidentificationStatus(
            failedStatus.session_id,
            failedStatus.transcribe_id
          )
        )
      ).toEqual(failedStatus)
    );
    await act(async () => {
      await Promise.resolve();
    });

    modal.rerender(result.current.deidModal);
    expect(modal.queryByText('error')).toBeNull();
    expect(modal.queryByText('NO_DEID_TARGETS')).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('status 조회 중 대상이 바뀌면 이전 세션 결과를 새 UI에 반영하지 않아야 합니다.', async () => {
    let resolveStatus!: (value: typeof succeededStatus) => void;
    mocks.getDeidentificationStatus
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStatus = resolve;
        })
      )
      .mockResolvedValueOnce(null);
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

    await waitFor(() =>
      expect(mocks.getDeidentificationStatus).toHaveBeenCalledTimes(1)
    );
    rerender({ sessionId: 'session-b', transcribeId: 'transcribe-b' });
    await waitFor(() =>
      expect(mocks.getDeidentificationStatus).toHaveBeenCalledTimes(2)
    );
    await act(async () => {
      resolveStatus(succeededStatus);
      await Promise.resolve();
    });

    expect(result.current.showDeid).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    const modal = render(result.current.deidModal, { wrapper });
    expect(modal.queryByText('complete')).toBeNull();
  });

  it('POST 응답 전 대상이 바뀌면 accepted 결과를 새 세션 UI에 반영하지 않아야 합니다.', async () => {
    let resolveCommand!: (value: DeidentificationStatusResponse) => void;
    mocks.deidentifyTranscript.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCommand = resolve;
      })
    );
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

    const modal = await confirm(result);
    await waitFor(() =>
      expect(mocks.deidentifyTranscript).toHaveBeenCalledTimes(1)
    );
    rerender({ sessionId: 'session-b', transcribeId: 'transcribe-b' });
    await act(async () => {
      resolveCommand(pendingStatus);
      await Promise.resolve();
    });

    modal.rerender(result.current.deidModal);
    expect(modal.queryByText('loading')).toBeNull();
    expect(result.current.showDeid).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('credit 확인 중 대상 세션이 바뀌면 이전 POST를 전송하지 않아야 합니다.', async () => {
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

    const modal = await confirm(result);
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

  it('credit preflight 중 확인을 연속 클릭해도 POST는 한 번만 전송해야 합니다.', async () => {
    let resolveGuard!: (value: { ok: true; remaining: number }) => void;
    mocks.checkCredit.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGuard = resolve;
      })
    );
    const { result } = renderDeidentification();

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
