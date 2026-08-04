import type { PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FileSessionConfig, MultiFileInfo } from '@/features/session/types';

const { createTutorialFirstAudioSessionMock, uploadAudioMock } = vi.hoisted(
  () => ({
    createTutorialFirstAudioSessionMock: vi.fn(),
    uploadAudioMock: vi.fn(),
  })
);

vi.mock('@/shared/api/adapters/stt', () => ({
  sttBackend: {
    createTutorialFirstAudioSession: createTutorialFirstAudioSessionMock,
    createAudioSession: vi.fn(),
  },
  InsufficientCreditError: class InsufficientCreditError extends Error {},
}));

vi.mock('../../services/s3UploadService', () => ({
  s3UploadService: {
    uploadAudio: uploadAudioMock,
  },
}));

import { useMultiSessionCreate } from '../useMultiSessionCreate';

const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const actualFile: MultiFileInfo = {
  id: 'actual-file',
  file: new File(['audio'], 'real-session.mp3', { type: 'audio/mpeg' }),
  name: 'real-session.mp3',
  size: 5,
  duration: 60,
  validationStatus: 'valid',
};

const actualConfig: FileSessionConfig = {
  fileId: actualFile.id,
  order: 1,
  sttModel: 'basic',
  clientId: '00000000-0000-0000-0000-000000000001',
};

describe('useMultiSessionCreate Tutorial 실제 업로드 경로', () => {
  it('S3 업로드 후 첫 오디오 전용 API를 한 번 호출한다', async () => {
    uploadAudioMock.mockResolvedValue({
      file_path: 'audio/67/real-session.mp3',
      file_size_mb: 0.01,
      duration_seconds: 60,
    });
    createTutorialFirstAudioSessionMock.mockResolvedValue({
      session_id: 'tutorial-real-session',
      status: 'accepted',
      stt_model: 'basic',
      message: '',
    });

    const { result } = renderHook(
      () =>
        useMultiSessionCreate({
          userId: 67,
          templateId: 1,
          tutorialFirstUpload: true,
        }),
      { wrapper }
    );

    let finalResults;
    await act(async () => {
      finalResults = await result.current.createSessions(
        [actualConfig],
        [actualFile]
      );
    });

    expect(uploadAudioMock).toHaveBeenCalledTimes(1);
    expect(createTutorialFirstAudioSessionMock).toHaveBeenCalledTimes(1);
    expect(createTutorialFirstAudioSessionMock).toHaveBeenCalledWith({
      user_id: 67,
      title: 'real-session.mp3',
      s3_key: 'audio/67/real-session.mp3',
      file_size_mb: 0.01,
      duration_seconds: 60,
      client_id: actualConfig.clientId,
      stt_model: 'basic',
      template_id: 1,
    });
    expect(finalResults).toEqual([
      expect.objectContaining({
        fileId: actualFile.id,
        status: 'success',
        sessionId: 'tutorial-real-session',
      }),
    ]);
  });
});
