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

  // ── 에러 / 엣지 경로 ──────────────────────────────────────────────────────

  it('getUploadUrl: 에러 message가 있으면 그대로 던진다', async () => {
    serverRequestMock.mockRejectedValue(new Error('네트워크 오류'));
    await expect(
      serverSttBackend.getUploadUrl(1, 'rec.mp3', 'audio/mpeg')
    ).rejects.toThrow('네트워크 오류');
  });

  it('getUploadUrl: message 없는 에러는 기본 메시지로 폴백한다', async () => {
    serverRequestMock.mockRejectedValue({});
    await expect(
      serverSttBackend.getUploadUrl(1, 'rec.mp3', 'audio/mpeg')
    ).rejects.toThrow('Presigned URL 생성 실패');
  });

  it('createAudioSession: 402 아닌 에러는 Error(message)로 던진다', async () => {
    serverRequestMock.mockRejectedValue(
      new ServerApiErrorClass(500, 'INTERNAL', '서버 내부 오류')
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
    ).rejects.toThrow('서버 내부 오류');
  });

  it('createAudioSession: 50자 초과 title은 slice(0,50)으로 잘린다', async () => {
    serverRequestMock.mockResolvedValue({
      sessionId: 'sess-x',
      sttModel: 'basic',
    });
    const longTitle = 'A'.repeat(60);
    await serverSttBackend.createAudioSession({
      user_id: 1,
      title: longTitle,
      s3_key: 'audio/x.mp3',
      file_size_mb: 1,
      duration_seconds: 60,
      client_id: null,
      stt_model: 'basic',
      template_id: 1,
    });
    const calledBody = serverRequestMock.mock.calls[0][1].body as {
      title: string;
    };
    expect(calledBody.title).toBe('A'.repeat(50));
  });

  it('createHandWrittenSession: camelCase 요청 바디 매핑을 검증한다 (counselDate/contents/clientId)', async () => {
    serverRequestMock.mockResolvedValue({
      sessionId: 'session-3',
      progressNoteId: 'note-2',
    });

    await serverSttBackend.createHandWrittenSession({
      user_id: 1,
      title: '직접입력 테스트',
      counsel_date: '2026-07-04',
      contents: '축어록 내용',
      template_id: 5,
      client_id: undefined,
    });

    expect(serverRequestMock).toHaveBeenCalledWith('/sessions/hand-written', {
      method: 'POST',
      body: {
        title: '직접입력 테스트',
        counselDate: '2026-07-04',
        contents: '축어록 내용',
        clientId: undefined,
        templateId: 5,
      },
    });
  });

  it('createHandWrittenSession: 50자 초과 title은 slice(0,50)으로 잘린다', async () => {
    serverRequestMock.mockResolvedValue({
      sessionId: 'sess-y',
      progressNoteId: 'note-y',
    });
    const longTitle = '가'.repeat(60);
    await serverSttBackend.createHandWrittenSession({
      user_id: 1,
      title: longTitle,
      counsel_date: '2026-07-04',
      contents: '내용',
      template_id: 1,
    });
    const calledBody = serverRequestMock.mock.calls[0][1].body as {
      title: string;
    };
    expect(calledBody.title).toBe('가'.repeat(50));
  });

  it('createHandWrittenSession: non-ServerApiError는 {status:500, message} shape로 던진다', async () => {
    serverRequestMock.mockRejectedValue(new Error('DB 연결 실패'));
    await expect(
      serverSttBackend.createHandWrittenSession({
        user_id: 1,
        title: '직접입력',
        counsel_date: '2026-07-04',
        contents: '내용',
        template_id: 3,
      })
    ).rejects.toMatchObject({ status: 500, message: 'DB 연결 실패' });
  });

  it('createHandWrittenSession: message 없는 non-ServerApiError는 기본 메시지로 폴백한다', async () => {
    serverRequestMock.mockRejectedValue({});
    await expect(
      serverSttBackend.createHandWrittenSession({
        user_id: 1,
        title: '직접입력',
        counsel_date: '2026-07-04',
        contents: '내용',
        template_id: 3,
      })
    ).rejects.toMatchObject({
      status: 500,
      message: '직접 입력 세션 생성 중 오류가 생겼어요.',
    });
  });

  it('getAudioPlaybackUrl: audioUrl이 빈 문자열이면 에러를 던진다', async () => {
    serverRequestMock.mockResolvedValue({ audioUrl: '' });
    await expect(
      serverSttBackend.getAudioPlaybackUrl('session-1')
    ).rejects.toThrow('Presigned URL을 가져올 수 없어요.');
  });

  it('getAudioPlaybackUrl: serverRequest 실패 시 폴백 메시지로 던진다', async () => {
    serverRequestMock.mockRejectedValue({});
    await expect(
      serverSttBackend.getAudioPlaybackUrl('session-1')
    ).rejects.toThrow('Presigned URL 생성 실패');
  });

  it('createProgressNote: 에러 발생 시 err.message로 던진다', async () => {
    serverRequestMock.mockRejectedValue(new Error('노트 생성 실패'));
    await expect(
      serverSttBackend.createProgressNote({
        sessionId: 'session-1',
        userId: 1,
        templateId: 3,
      })
    ).rejects.toThrow('노트 생성 실패');
  });

  it('createProgressNote: message 없는 에러는 기본 메시지로 폴백한다', async () => {
    serverRequestMock.mockRejectedValue({});
    await expect(
      serverSttBackend.createProgressNote({
        sessionId: 'session-1',
        userId: 1,
        templateId: 3,
      })
    ).rejects.toThrow('상담노트 추가 중 오류가 생겼어요.');
  });

  it('getSessionStatus: camelCase 서버 응답을 snake_case SessionStatusResult로 매핑하고 success:true를 합성한다', async () => {
    serverRequestMock.mockResolvedValue({
      sessionId: 'session-1',
      processingStatus: 'transcribing',
      transcribeId: 'transcribe-1',
      progressNoteId: null,
      errorMessage: null,
      progressPercentage: 45,
      currentStep: 'STT 진행 중',
      estimatedCompletionTime: null,
    });

    const result = await serverSttBackend.getSessionStatus('session-1');

    expect(serverRequestMock).toHaveBeenCalledWith(
      '/sessions/session-1/status'
    );
    expect(result).toEqual({
      success: true,
      session_id: 'session-1',
      processing_status: 'transcribing',
      transcribe_id: 'transcribe-1',
      progress_percentage: 45,
      current_step: 'STT 진행 중',
    });
    // null 필드는 optional이므로 키 자체가 없어야 한다
    expect(result).not.toHaveProperty('progress_note_id');
    expect(result).not.toHaveProperty('error_message');
    expect(result).not.toHaveProperty('estimated_completion_time');
  });

  it('getSessionStatus: 에러 발생 시 err.message로 던진다', async () => {
    serverRequestMock.mockRejectedValue(new Error('세션 없음'));
    await expect(
      serverSttBackend.getSessionStatus('session-99')
    ).rejects.toThrow('세션 없음');
  });

  it('getSessionStatus: message 없는 에러는 기본 메시지로 폴백한다', async () => {
    serverRequestMock.mockRejectedValue({});
    await expect(
      serverSttBackend.getSessionStatus('session-99')
    ).rejects.toThrow('세션 상태 조회 중 오류가 생겼어요.');
  });
});
