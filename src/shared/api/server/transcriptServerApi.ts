import {
  getSegments,
  getSpeakers,
  type Contents,
} from '@/features/session/utils/contentsEditor';

import { serverRequest } from './serverClient';

export interface UpdateTranscriptParams {
  sessionId: string;
  transcribeId: string;
  expectedRevision: number;
  expectedContentsFingerprint: string;
  baseContents: Contents;
  contents: Contents;
}

export interface UpdateTranscriptResponse {
  revision: number;
  contentsFingerprint: string;
}

export interface UpdateHandwrittenTranscriptParams {
  sessionId: string;
  transcribeId: string;
  expectedRevision: number;
  expectedContentsFingerprint: string;
  baseContents: string;
  contents: string;
}

export interface DeidentifyTranscriptParams {
  sessionId: string;
  transcribeId: string;
  expectedRevision: number;
  expectedContentsFingerprint: string;
}

export interface DeidentificationStatusParams {
  sessionId: string;
  transcribeId: string;
}

export type DeidentificationStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed';

export interface DeidentificationStatusResponse {
  id: string;
  status: DeidentificationStatus;
  session_id: string;
  transcribe_id: string;
  stats?: {
    total_segments: number;
    deid_segments: number;
    deid_tags: number;
    consistency_rate: number;
    nv_preserve_rate: number;
  };
  revision?: number;
  contents_fingerprint?: string;
  error_code?: string;
}

export type DeidentifyTranscriptResponse = DeidentificationStatusResponse;

function deidentificationPath({
  sessionId,
  transcribeId,
}: DeidentificationStatusParams): string {
  return `/sessions/${encodeURIComponent(sessionId)}/transcribes/${encodeURIComponent(transcribeId)}/deidentification`;
}

/**
 * 축어록 편집 저장.
 *
 * 서버가 session/transcribe/user 귀속과 revision/fingerprint를 함께 검증하므로
 * 다른 세션에서 만든 편집 스냅샷이나 오래된 탭의 저장은 409/404로 거절된다.
 */
export function updateTranscript({
  sessionId,
  transcribeId,
  expectedRevision,
  expectedContentsFingerprint,
  baseContents,
  contents,
}: UpdateTranscriptParams): Promise<UpdateTranscriptResponse> {
  return serverRequest<UpdateTranscriptResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/transcribes/${encodeURIComponent(transcribeId)}`,
    {
      method: 'PATCH',
      body: {
        expectedRevision,
        expectedContentsFingerprint,
        baseSegments: getSegments(baseContents),
        baseSpeakers: getSpeakers(baseContents),
        segments: getSegments(contents),
        speakers: getSpeakers(contents),
      },
    }
  );
}

/** 직접 입력 축어록을 동일한 session/transcribe/revision CAS 계약으로 저장한다. */
export function updateHandwrittenTranscript({
  sessionId,
  transcribeId,
  expectedRevision,
  expectedContentsFingerprint,
  baseContents,
  contents,
}: UpdateHandwrittenTranscriptParams): Promise<UpdateTranscriptResponse> {
  return serverRequest<UpdateTranscriptResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/handwritten-transcribes/${encodeURIComponent(transcribeId)}`,
    {
      method: 'PATCH',
      body: {
        expectedRevision,
        expectedContentsFingerprint,
        baseContents,
        contents,
      },
    }
  );
}

/**
 * 비식별화 command. userId·본문·멱등 키는 브라우저가 보내지 않고 서버가
 * 인증 principal과 현재 transcript snapshot으로 ownership/credit/CAS를 결정한다.
 */
export function deidentifyTranscript({
  sessionId,
  transcribeId,
  expectedRevision,
  expectedContentsFingerprint,
}: DeidentifyTranscriptParams): Promise<DeidentifyTranscriptResponse> {
  return serverRequest<DeidentifyTranscriptResponse>(
    deidentificationPath({ sessionId, transcribeId }),
    {
      method: 'POST',
      body: {
        expectedRevision,
        expectedContentsFingerprint,
      },
    }
  );
}

/** 현재 transcript의 최신 비식별화 작업 상태를 조회한다. */
export function getDeidentificationStatus({
  sessionId,
  transcribeId,
}: DeidentificationStatusParams): Promise<DeidentificationStatusResponse> {
  return serverRequest<DeidentificationStatusResponse>(
    deidentificationPath({ sessionId, transcribeId })
  );
}
