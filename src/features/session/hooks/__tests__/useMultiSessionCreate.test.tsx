import type { PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  FileSessionConfig,
  MultiFileInfo,
  SessionCreateResult,
} from '@/features/session/types';

import { useMultiSessionCreate } from '../useMultiSessionCreate';

const mocks = vi.hoisted(() => ({
  createSessionBackground: vi.fn(),
  uploadAudio: vi.fn(),
}));

vi.mock('@/shared/api/supabase/sessionQueries', () => ({
  createSessionBackground: mocks.createSessionBackground,
  InsufficientCreditError: class InsufficientCreditError extends Error {},
}));

vi.mock('../../services/s3UploadService', () => ({
  s3UploadService: {
    uploadAudio: mocks.uploadAudio,
  },
}));

const config: FileSessionConfig = {
  fileId: 'file-1',
  order: 1,
  sttModel: 'advanced',
};

const file: MultiFileInfo = {
  id: 'file-1',
  file: new File(['audio'], 'session.wav', { type: 'audio/wav' }),
  name: 'session.wav',
  size: 5,
  duration: 60,
  validationStatus: 'valid',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useMultiSessionCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSessionBackground.mockResolvedValue({
      session_id: 'session-1',
      status: 'accepted',
      stt_model: 'advanced',
      message: 'accepted',
    });
  });

  it('크레딧 조회 중 재진입해도 세션 생성 흐름은 한 번만 실행한다', async () => {
    let resolveUpload!: (value: {
      file_path: string;
      file_size_mb: number;
      duration_seconds: number;
    }) => void;
    mocks.uploadAudio.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    const { result } = renderHook(
      () => useMultiSessionCreate({ userId: 1, templateId: 1 }),
      { wrapper: createWrapper() }
    );

    let firstCall!: Promise<SessionCreateResult[]>;
    act(() => {
      firstCall = result.current.createSessions([config], [file]);
    });

    let secondCall!: Promise<SessionCreateResult[]>;
    await act(async () => {
      secondCall = result.current.createSessions([config], [file]);
    });
    const secondResult = await secondCall;

    expect(mocks.uploadAudio).toHaveBeenCalledTimes(1);
    expect(mocks.createSessionBackground).not.toHaveBeenCalled();
    expect(secondResult).toEqual([]);

    await act(async () => {
      resolveUpload({
        file_path: 'users/1/session.wav',
        file_size_mb: 1,
        duration_seconds: 60,
      });
      await firstCall;
    });

    expect(mocks.createSessionBackground).toHaveBeenCalledTimes(1);
  });
});
