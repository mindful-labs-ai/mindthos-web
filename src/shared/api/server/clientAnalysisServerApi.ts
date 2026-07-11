import { serverRequest } from './serverClient';

/**
 * 다회기 분석(AI 슈퍼비전) 생성 API (mindthos-server).
 *
 * 흐름: 프론트가 생성 요청 → 서버가 크레딧 예약·DB row 생성·머신 큐 publish.
 * 서버는 즉시 analysisId/version만 반환하고, 실제 결과는 머신이
 * client_analyses.content(section/block JSON)에 비동기로 기록한다.
 * 상태 폴링은 Supabase client_analyses를 직접 조회한다.
 *
 * user_id는 더 이상 body로 보내지 않는다(서버가 Bearer JWT에서 도출).
 */

export const SUPERVISION_ANALYSIS_ROUTES = {
  /** 생성 (POST): clients/:clientId/supervision-analyses */
  create: (clientId: string) => `/clients/${clientId}/supervision-analyses`,
} as const;

/** POST /clients/:clientId/supervision-analyses 응답 data */
export interface CreateSupervisionAnalysisResponse {
  analysisId: string;
  version: number;
}

/** 다회기 분석 생성 — 크레딧 예약 + 머신 큐 publish는 서버가 수행. */
export function createSupervisionAnalysis(
  clientId: string,
  body: { sessionIds: string[]; aiSupervisionTemplateId: number }
): Promise<CreateSupervisionAnalysisResponse> {
  return serverRequest<CreateSupervisionAnalysisResponse>(
    SUPERVISION_ANALYSIS_ROUTES.create(clientId),
    { method: 'POST', body }
  );
}
