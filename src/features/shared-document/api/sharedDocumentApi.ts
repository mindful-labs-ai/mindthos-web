import type {
  DocumentContent,
  DocumentResponse,
} from '@/features/document/types';
import { serverRequestPublic } from '@/shared/api/server/serverClient';

/**
 * 내담자 공유 링크(@Public + 토큰 가드) API.
 * 인증은 URL의 raw 토큰이 담당하므로 Bearer 없이 호출한다(serverRequestPublic).
 *
 * 서버 계약:
 *  - GET    /v1/shared-documents/:clientId/:sentRowId/:accessToken          → SharedDocument
 *  - POST   /v1/shared-documents/:clientId/:sentRowId/:accessToken/response → SharedDocument
 */

/** 공유 문서 식별 파라미터(URL에서 추출) */
export interface SharedDocumentParams {
  clientId: string;
  sentRowId: string;
  accessToken: string;
}

/** GET/POST 공통 응답 (SharedDocumentDto) */
export interface SharedDocument {
  documentTitle: string;
  /** 대상 내담자 이름(진입 화면 안내용) */
  clientName: string;
  /** 보낸 상담사 이름(진입 화면 안내용) */
  counselorName: string;
  /** 동의서 / 질문응답 — 카테고리·UX 힌트(퍼널 모드 결정). content 모양은 동일. */
  kind: 'CONSENT' | 'QNA';
  /** 통합 본문 봉투 { version, fields } — CONSENT/QNA 공통. */
  content: DocumentContent;
  /** 마감 기한 ISO (null = 무기한) */
  expiredAt: string | null;
  /** 이미 제출했다면 그 응답(null = 미제출) */
  response: DocumentResponse | null;
  /** 제출 시각 ISO (null = 미제출) */
  completedAt: string | null;
}

function basePath({ clientId, sentRowId, accessToken }: SharedDocumentParams) {
  return `/shared-documents/${clientId}/${sentRowId}/${accessToken}`;
}

/** 공유 문서 열람(토큰 검증·만료/취소 검사는 서버 가드). */
export function fetchSharedDocument(
  params: SharedDocumentParams
): Promise<SharedDocument> {
  return serverRequestPublic<SharedDocument>(basePath(params));
}

/**
 * 내담자 응답/서명 제출. 이미 제출/만료/취소면 서버가 409.
 * sensitiveInfoConsent: 모든 공유문서 공통 [필수] 민감정보 동의(인트로 게이트) — 서버가 true 요구.
 */
export function submitSharedDocument(
  params: SharedDocumentParams,
  response: DocumentResponse,
  sensitiveInfoConsent: boolean
): Promise<SharedDocument> {
  return serverRequestPublic<SharedDocument>(`${basePath(params)}/response`, {
    method: 'POST',
    body: { response, sensitiveInfoConsent },
  });
}
