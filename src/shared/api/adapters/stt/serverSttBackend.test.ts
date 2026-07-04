import { beforeEach, describe, expect, it, vi } from 'vitest';

import { serverSttBackend } from './serverSttBackend';
import { InsufficientCreditError } from './sttBackendPort';

const { serverRequestMock, ServerApiErrorClass } = vi.hoisted(() => {
  class ServerApiErrorClass extends Error {
    readonly status: number;
    readonly statusCode: string;
    constructor(status: number, statusCode: string, message: string) {
      super(message);
      this.name = 'ServerApiError';
      this.status = status;
      this.statusCode = statusCode;
    }
  }
  return { serverRequestMock: vi.fn(), ServerApiErrorClass };
});

vi.mock('@/shared/api/server/serverClient', () => ({
  serverRequest: serverRequestMock,
  ServerApiError: ServerApiErrorClass,
}));

describe('serverSttBackend — 서버 camelCase 응답을 기존 snake_case shape로 매핑', () => {
  beforeEach(() => {
    serverRequestMock.mockReset();
  });

  it('getUploadUrl: /sessions/upload-url 응답을 기존 UploadUrlResult로 변환한다', async () => {
    serverRequestMock.mockResolvedValue({
      presignedUrl: 'https://s3/put',
      s3Key: 'audio/20260704/user-1-000000.mp3',
      publicUrl: 'https://s3/get',
      expiresIn: 900,
    });

    const result = await serverSttBackend.getUploadUrl(
      1,
      'rec.mp3',
      'audio/mpeg'
    );

    expect(serverRequestMock).toHaveBeenCalledWith('/sessions/upload-url', {
      method: 'POST',
      body: { filename: 'rec.mp3', contentType: 'audio/mpeg' },
    });
    expect(result).toEqual({
      presigned_url: 'https://s3/put',
      s3_key: 'audio/20260704/user-1-000000.mp3',
      public_url: 'https://s3/get',
      expires_in: 900,
    });
  });

  it('createAudioSession: snake_case 요청을 camelCase로 보내고 accepted shape로 돌려준다', async () => {
    serverRequestMock.mockResolvedValue({
      sessionId: 'session-1',
      sttModel: 'basic',
    });

    const result = await serverSttBackend.createAudioSession({
      user_id: 1,
      title: '상담 녹음',
      s3_key: 'audio/x.mp3',
      file_size_mb: 12.5,
      duration_seconds: 600,
      client_id: null,
      stt_model: 'basic',
      template_id: 3,
    });

    expect(serverRequestMock).toHaveBeenCalledWith('/sessions', {
      method: 'POST',
      body: {
        title: '상담 녹음',
        s3Key: 'audio/x.mp3',
        fileSizeMb: 12.5,
        durationSeconds: 600,
        clientId: undefined,
        sttModel: 'basic',
        templateId: 3,
      },
    });
    expect(result).toMatchObject({
      session_id: 'session-1',
      status: 'accepted',
      stt_model: 'basic',
    });
  });

  it('createAudioSession: 402는 InsufficientCreditError로 변환한다', async () => {
    serverRequestMock.mockRejectedValue(
      new ServerApiErrorClass(402, 'PAYMENT_REQUIRED', '크레딧이 부족해요.')
    );

    await expect(
      serverSttBackend.createAudioSession({
        user_id: 1,
        title: '상담 녹음',
        s3_key: 'audio/x.mp3',
        file_size_mb: 12.5,
        duration_seconds: 600,
        client_id: null,
        stt_model: 'basic',
        template_id: 3,
      })
    ).rejects.toBeInstanceOf(InsufficientCreditError);
  });

  it('createHandWrittenSession: 기존 EF 응답 shape(success/snake_case)로 매핑하고, 에러는 {status,message}로 던진다', async () => {
    serverRequestMock.mockResolvedValue({
      sessionId: 'session-2',
      progressNoteId: 'note-1',
    });

    const result = await serverSttBackend.createHandWrittenSession({
      user_id: 1,
      title: '직접입력',
      counsel_date: '2026-07-04',
      contents: '축어록 본문',
      template_id: 3,
    });

    expect(result).toEqual({
      success: true,
      session_id: 'session-2',
      progress_note_id: 'note-1',
    });

    serverRequestMock.mockRejectedValue(
      new ServerApiErrorClass(402, 'PAYMENT_REQUIRED', '크레딧이 부족해요.')
    );
    await expect(
      serverSttBackend.createHandWrittenSession({
        user_id: 1,
        title: '직접입력',
        counsel_date: '2026-07-04',
        contents: '축어록 본문',
        template_id: 3,
      })
    ).rejects.toMatchObject({ status: 402 });
  });

  it('getAudioPlaybackUrl/createProgressNote: 응답 필드를 기존 shape로 매핑한다', async () => {
    serverRequestMock.mockResolvedValueOnce({ audioUrl: 'https://s3/audio' });
    await expect(
      serverSttBackend.getAudioPlaybackUrl('session-1')
    ).resolves.toBe('https://s3/audio');
    expect(serverRequestMock).toHaveBeenCalledWith(
      '/sessions/session-1/audio-url'
    );

    serverRequestMock.mockResolvedValueOnce({ progressNoteId: 'note-9' });
    await expect(
      serverSttBackend.createProgressNote({
        sessionId: 'session-1',
        userId: 1,
        templateId: 3,
      })
    ).resolves.toEqual({ success: true, progress_note_id: 'note-9' });
    expect(serverRequestMock).toHaveBeenLastCalledWith(
      '/sessions/session-1/progress-notes',
      { method: 'POST', body: { templateId: 3 } }
    );
  });
});
