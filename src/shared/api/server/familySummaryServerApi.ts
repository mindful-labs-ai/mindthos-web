import { serverRequest } from './serverClient';

/**
 * 가계도(family-summary) 생성 API (mindthos-server).
 *
 * 흐름: 프론트가 생성 요청 → 서버가 크레딧 정산·DB row 생성·머신 큐 publish.
 * 서버는 즉시 pending/completed만 반환하고, 실제 결과(가계도 AI JSON)는
 * 머신이 비동기로 기록한다. 상태는 status 엔드포인트로 폴링한다.
 *
 * 구 Supabase Edge Function(generate-family-summary)의 동기 호출을 대체한다.
 * user_id는 body로 보내지 않는다(서버가 Bearer JWT에서 도출).
 */

export const FAMILY_SUMMARY_ROUTES = {
  /** 생성 트리거 (POST) */
  create: '/family-summaries',
  /** 상태 조회 (GET, clientId 쿼리) */
  status: '/family-summaries/status',
  /** 서버측 요약·상태 초기화 (POST) */
  reset: '/family-summaries/reset',
} as const;

/** POST /family-summaries 응답 data. completed = 캐시 존재(무과금·무작업), pending = 작업 발행됨. */
export interface TriggerFamilySummaryResponse {
  clientId: string;
  status: 'pending' | 'completed';
}

/** GET /family-summaries/status 응답 data. familySummary는 completed일 때만 존재(구 EF ai_output). */
export interface FamilySummaryStatusResponse {
  clientId: string;
  status: 'none' | 'pending' | 'completed' | 'failed';
  familySummary?: object;
  errorMessage?: string;
}

/** 가계도 생성 트리거 — 크레딧 정산 + 머신 큐 publish는 서버가 수행. */
export function triggerFamilySummary(
  clientId: string,
  opts?: { forceRefresh?: boolean; idempotencyKey?: string }
): Promise<TriggerFamilySummaryResponse> {
  return serverRequest<TriggerFamilySummaryResponse>(
    FAMILY_SUMMARY_ROUTES.create,
    {
      method: 'POST',
      body: {
        clientId,
        ...(opts?.forceRefresh !== undefined && {
          forceRefresh: opts.forceRefresh,
        }),
        ...(opts?.idempotencyKey !== undefined && {
          idempotencyKey: opts.idempotencyKey,
        }),
      },
    }
  );
}

/** 가계도 생성 상태 조회(폴링용). */
export function getFamilySummaryStatus(
  clientId: string
): Promise<FamilySummaryStatusResponse> {
  return serverRequest<FamilySummaryStatusResponse>(
    `${FAMILY_SUMMARY_ROUTES.status}?clientId=${encodeURIComponent(clientId)}`
  );
}

/** 서버측 가계도 요약·상태 초기화 — 구 EF /init의 clients.family_summary 초기화 대체. */
export function resetFamilySummary(clientId: string): Promise<void> {
  return serverRequest<void>(FAMILY_SUMMARY_ROUTES.reset, {
    method: 'POST',
    body: { clientId },
  });
}
