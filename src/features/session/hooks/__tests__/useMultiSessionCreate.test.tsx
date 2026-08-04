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
  createTutorialFirstSession: vi.fn(),
  uploadAudio: vi.fn(),
}));

vi.mock('@/shared/api/supabase/sessionQueries', () => ({
  createSessionBackground: mocks.createSessionBackground,
  createTutorialFirstSession: mocks.createTutorialFirstSession,
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
    mocks.uploadAudio.mockResolvedValue({
      file_path: 'users/1/session.wav',
      file_size_mb: 1,
      duration_seconds: 60,
    });
    mocks.createSessionBackground.mockResolvedValue({
      session_id: 'session-1',
      status: 'accepted',
      stt_model: 'advanced',
      message: 'accepted',
    });
    mocks.createTutorialFirstSession.mockResolvedValue({
      session_id: 'tutorial-session-1',
      status: 'accepted',
      stt_model: 'basic',
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

    let firstCall!: Promise<SessionCreateResult[] | null>;
    act(() => {
      firstCall = result.current.createSessions([config], [file]);
    });

    let secondCall!: Promise<SessionCreateResult[] | null>;
    await act(async () => {
      secondCall = result.current.createSessions([config], [file]);
    });
    const secondResult = await secondCall;

    expect(mocks.uploadAudio).toHaveBeenCalledTimes(1);
    expect(mocks.createSessionBackground).not.toHaveBeenCalled();
    expect(secondResult).toBeNull();

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

  it('크레딧 조회 중 재진입해도 사전 검사와 세션 생성은 한 번만 실행한다', async () => {
    let resolveCreditCheck!: (value: boolean) => void;
    const beforeCreate = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveCreditCheck = resolve;
        })
    );

    const { result } = renderHook(
      () => useMultiSessionCreate({ userId: 1, templateId: 1 }),
      { wrapper: createWrapper() }
    );

    let firstCall!: Promise<SessionCreateResult[] | null>;
    act(() => {
      firstCall = result.current.createSessions([config], [file], beforeCreate);
    });

    let secondResult!: SessionCreateResult[] | null;
    await act(async () => {
      secondResult = await result.current.createSessions(
        [config],
        [file],
        beforeCreate
      );
    });

    expect(beforeCreate).toHaveBeenCalledTimes(1);
    expect(mocks.uploadAudio).not.toHaveBeenCalled();
    expect(secondResult).toBeNull();

    await act(async () => {
      resolveCreditCheck(true);
      await firstCall;
    });

    expect(mocks.uploadAudio).toHaveBeenCalledTimes(1);
    expect(mocks.createSessionBackground).toHaveBeenCalledTimes(1);
  });

  it('크레딧 사전 검사에서 중단된 뒤에는 다시 생성할 수 있다', async () => {
    const beforeCreate = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(
      () => useMultiSessionCreate({ userId: 1, templateId: 1 }),
      { wrapper: createWrapper() }
    );

    let blockedResult!: SessionCreateResult[] | null;
    await act(async () => {
      blockedResult = await result.current.createSessions(
        [config],
        [file],
        beforeCreate
      );
    });

    expect(blockedResult).toBeNull();
    expect(mocks.uploadAudio).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.createSessions([config], [file]);
    });

    expect(mocks.uploadAudio).toHaveBeenCalledTimes(1);
    expect(mocks.createSessionBackground).toHaveBeenCalledTimes(1);
  });

  it('Tutorial 실제 업로드는 S3 업로드 후 첫 파일 전용 API를 호출한다', async () => {
    const tutorialConfig: FileSessionConfig = {
      ...config,
      sttModel: 'basic',
      clientId: '00000000-0000-0000-0000-000000000001',
    };

    const { result } = renderHook(
      () =>
        useMultiSessionCreate({
          userId: 67,
          templateId: 1,
          tutorialFirstUpload: true,
        }),
      { wrapper: createWrapper() }
    );

    let finalResults!: SessionCreateResult[] | null;
    await act(async () => {
      finalResults = await result.current.createSessions(
        [tutorialConfig],
        [file]
      );
    });

    expect(mocks.uploadAudio).toHaveBeenCalledTimes(1);
    expect(mocks.createSessionBackground).not.toHaveBeenCalled();
    expect(mocks.createTutorialFirstSession).toHaveBeenCalledTimes(1);
    expect(mocks.createTutorialFirstSession).toHaveBeenCalledWith({
      user_id: 67,
      title: 'session.wav',
      s3_key: 'users/1/session.wav',
      file_size_mb: 1,
      duration_seconds: 60,
      client_id: tutorialConfig.clientId,
      stt_model: 'basic',
      template_id: 1,
    });
    expect(finalResults).toEqual([
      expect.objectContaining({
        fileId: file.id,
        status: 'success',
        sessionId: 'tutorial-session-1',
      }),
    ]);
  });
});
