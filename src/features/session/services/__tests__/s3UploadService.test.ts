import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sttBackend } from '@/shared/api/adapters/stt';

import { S3UploadError } from '../../types/s3Upload.types';
import { uploadAudioToS3 } from '../s3UploadService';

vi.mock('@/shared/api/adapters/stt', () => ({
  sttBackend: {
    getUploadUrl: vi.fn(),
  },
}));

const mockGetUploadUrl = vi.mocked(sttBackend.getUploadUrl);

/** jsdom은 미디어 로딩을 구현하지 않으므로 메타데이터 이벤트를 직접 발화한다. */
class MockAudio {
  duration = 60;
  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(type: string, cb: () => void) {
    (this.listeners[type] ??= []).push(cb);
  }

  set src(_value: string) {
    this.listeners['loadedmetadata']?.forEach((cb) => cb());
  }
}

type XhrOutcome =
  | { type: 'load'; status: number; statusText?: string }
  | { type: 'error' };

/** send() 시점에 시나리오 큐(xhrOutcomes)를 꺼내 즉시 결과 이벤트를 발화한다. */
let xhrOutcomes: XhrOutcome[] = [];
let xhrSendCount = 0;

class MockXhr {
  status = 0;
  statusText = '';
  upload = { addEventListener: vi.fn() };
  open = vi.fn();
  setRequestHeader = vi.fn();
  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(type: string, cb: () => void) {
    (this.listeners[type] ??= []).push(cb);
  }

  send() {
    xhrSendCount += 1;
    const outcome = xhrOutcomes.shift() ?? {
      type: 'load' as const,
      status: 200,
    };
    if (outcome.type === 'load') {
      this.status = outcome.status;
      this.statusText = outcome.statusText ?? '';
      this.listeners['load']?.forEach((cb) => cb());
    } else {
      this.listeners['error']?.forEach((cb) => cb());
    }
  }
}

const makeFile = (name = 'session.mp3') =>
  new File(['audio-bytes'], name, { type: 'audio/mpeg' });

const presignResult = {
  presigned_url: 'https://s3.example.com/presigned',
  s3_key: 'audio/1/session.mp3',
  public_url: 'https://s3.example.com/public',
  expires_in: 900,
};

describe('uploadAudioToS3', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('Audio', MockAudio);
    vi.stubGlobal('XMLHttpRequest', MockXhr);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    xhrOutcomes = [];
    xhrSendCount = 0;
    mockGetUploadUrl.mockResolvedValue(presignResult);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('네트워크 오류 후 재시도로 성공한다 (2회 실패 → 3회차 성공)', async () => {
    xhrOutcomes = [
      { type: 'error' },
      { type: 'error' },
      { type: 'load', status: 200 },
    ];

    const promise = uploadAudioToS3({ file: makeFile(), user_id: 1 });
    await vi.advanceTimersByTimeAsync(3100); // 백오프 1s + 2s 소진

    await expect(promise).resolves.toMatchObject({
      success: true,
      file_path: presignResult.s3_key,
      duration_seconds: 60,
    });
    expect(xhrSendCount).toBe(3);
  });

  it('재시도 상한(3회)까지 전부 실패하면 NETWORK_ERROR로 던진다', async () => {
    xhrOutcomes = [{ type: 'error' }, { type: 'error' }, { type: 'error' }];

    const promise = uploadAudioToS3({ file: makeFile(), user_id: 1 });
    promise.catch(() => {}); // 타이머 진행 중 unhandled rejection 방지
    await vi.advanceTimersByTimeAsync(3100);

    await expect(promise).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      retryable: true,
    });
    expect(xhrSendCount).toBe(3);
  });

  it('4xx 응답은 재시도 없이 즉시 실패하고 상태를 메시지에 남긴다', async () => {
    xhrOutcomes = [{ type: 'load', status: 403, statusText: 'Forbidden' }];

    const promise = uploadAudioToS3({ file: makeFile(), user_id: 1 });
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toMatchObject({
      code: 'UPLOAD_FAILED',
      message: '업로드 실패: 403 Forbidden',
    });
    expect(xhrSendCount).toBe(1);
  });

  it('5xx 응답은 재시도 대상이다', async () => {
    xhrOutcomes = [
      { type: 'load', status: 500, statusText: 'Internal Server Error' },
      { type: 'load', status: 200 },
    ];

    const promise = uploadAudioToS3({ file: makeFile(), user_id: 1 });
    await vi.advanceTimersByTimeAsync(1100);

    await expect(promise).resolves.toMatchObject({ success: true });
    expect(xhrSendCount).toBe(2);
  });

  it('presigned URL 발급 실패 시 서버 메시지를 유실하지 않는다', async () => {
    mockGetUploadUrl.mockRejectedValue(new Error('로그인이 필요합니다.'));

    const promise = uploadAudioToS3({ file: makeFile(), user_id: 1 });
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toMatchObject({
      code: 'UPLOAD_FAILED',
      message: '로그인이 필요합니다.',
    });
  });

  it('던져지는 에러는 Error 인스턴스다 — instanceof Error 분기에서 메시지가 보존된다', async () => {
    xhrOutcomes = [{ type: 'load', status: 403, statusText: 'Forbidden' }];

    const promise = uploadAudioToS3({ file: makeFile(), user_id: 1 });
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(100);

    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(S3UploadError);
    expect((error as Error).message).toBe('업로드 실패: 403 Forbidden');
  });

  it('지원하지 않는 확장자는 업로드 전에 INVALID_FILE_TYPE으로 거절한다', async () => {
    const promise = uploadAudioToS3({
      file: new File(['x'], 'notes.txt', { type: 'text/plain' }),
      user_id: 1,
    });

    await expect(promise).rejects.toMatchObject({ code: 'INVALID_FILE_TYPE' });
    expect(mockGetUploadUrl).not.toHaveBeenCalled();
    expect(xhrSendCount).toBe(0);
  });
});
