import { serverRequest } from '@/shared/api/server/serverClient';

export const SESSION_ROUTES = {
  /** 아이템 단건 삭제(DELETE) */
  item: (sessionId: string) => `/sessions/${sessionId}`,
} as const;

/**
 * 세션 삭제 — DELETE /v1/sessions/:sessionId.
 *
 * PostgREST 직접 DELETE를 대체한다. 직접 DELETE는 sessions row만 지워서 축어록·상담노트·
 * STT job이 고아로 남고 held 크레딧이 풀리지 않았다. 서버 API는 이 정리와 진행 중 AI 작업
 * 취소를 한 트랜잭션으로 처리한다. 이미 없는 세션이면 204(멱등).
 */
export function deleteSession(sessionId: string): Promise<void> {
  return serverRequest<void>(SESSION_ROUTES.item(sessionId), {
    method: 'DELETE',
  });
}
