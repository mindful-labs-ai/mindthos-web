import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deidentifyTranscript,
  updateHandwrittenTranscript,
  updateTranscript,
} from './transcriptServerApi';

const mocks = vi.hoisted(() => ({
  serverRequest: vi.fn(),
}));

vi.mock('./serverClient', () => ({
  serverRequest: mocks.serverRequest,
}));

describe('transcriptServerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.serverRequest.mockResolvedValue({
      revision: 2,
      contentsFingerprint: 'b'.repeat(32),
    });
  });

  it('편집 시작 base와 최종 segments/speakers, CAS 값만 전송해야 합니다.', async () => {
    await updateTranscript({
      sessionId: 'session-a',
      transcribeId: 'transcribe-a',
      expectedRevision: 1,
      expectedContentsFingerprint: 'a'.repeat(32),
      baseContents: {
        language: 'ko',
        segments: [{ id: 1, start: 0, end: 1, speaker: 0, text: '원문' }],
        speakers: [{ id: 0, role: 'client1' }],
        text: '원문',
        raw_output: 'base raw output도 전송하면 안 됨',
        stt_model: 'basic',
      },
      contents: {
        language: 'ko',
        segments: [{ id: 1, start: 0, end: 1, speaker: 0, text: '수정본' }],
        speakers: [{ id: 0, role: 'counselor' }],
        text: '수정본',
        raw_output: '클라이언트가 전송하면 안 되는 원본',
        stt_model: 'basic',
      },
    });

    expect(mocks.serverRequest).toHaveBeenCalledWith(
      '/sessions/session-a/transcribes/transcribe-a',
      {
        method: 'PATCH',
        body: {
          expectedRevision: 1,
          expectedContentsFingerprint: 'a'.repeat(32),
          baseSegments: [{ id: 1, start: 0, end: 1, speaker: 0, text: '원문' }],
          baseSpeakers: [{ id: 0, role: 'client1' }],
          segments: [{ id: 1, start: 0, end: 1, speaker: 0, text: '수정본' }],
          speakers: [{ id: 0, role: 'counselor' }],
        },
      }
    );
  });

  it('직접 입력 축어록도 session/transcribe와 CAS 값을 함께 전송해야 합니다.', async () => {
    await updateHandwrittenTranscript({
      sessionId: 'session-a',
      transcribeId: 'handwritten-a',
      expectedRevision: 3,
      expectedContentsFingerprint: 'c'.repeat(32),
      baseContents: '편집 시작 시점의 직접 입력 축어록',
      contents: '수정한 직접 입력 축어록',
    });

    expect(mocks.serverRequest).toHaveBeenCalledWith(
      '/sessions/session-a/handwritten-transcribes/handwritten-a',
      {
        method: 'PATCH',
        body: {
          expectedRevision: 3,
          expectedContentsFingerprint: 'c'.repeat(32),
          baseContents: '편집 시작 시점의 직접 입력 축어록',
          contents: '수정한 직접 입력 축어록',
        },
      }
    );
  });

  it('비식별화는 사용자 ID나 본문 없이 대상 snapshot 식별자만 전송해야 합니다.', async () => {
    await deidentifyTranscript({
      sessionId: 'session/a',
      transcribeId: 'transcribe/a',
      expectedRevision: 4,
      expectedContentsFingerprint: 'd'.repeat(32),
    });

    expect(mocks.serverRequest).toHaveBeenCalledWith(
      '/sessions/session%2Fa/transcribes/transcribe%2Fa/deidentification',
      {
        method: 'POST',
        body: {
          expectedRevision: 4,
          expectedContentsFingerprint: 'd'.repeat(32),
        },
      }
    );
  });
});
