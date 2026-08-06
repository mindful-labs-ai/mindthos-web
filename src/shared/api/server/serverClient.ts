import { ROUTES } from '@/app/router/constants';
import { supabase } from '@/lib/supabase';
import { appendUtmParams } from '@/shared/utils/utm';
import { useUtmStore } from '@/stores/utmStore';

/**
 * mindthos-server (NestJS) 전용 REST 클라이언트.
 *
 * - 인증: Supabase access token을 Bearer로 첨부 (서버가 GoTrue로 검증).
 * - 응답: 서버는 `{ statusCode, message, data }` 봉투로 응답하므로 data만 반환.
 */

// 배포 API base(끝 슬래시 제거). `/` 또는 빈 값이면 same-origin 상대경로를
// 사용한다. ECS nginx는 `/v1/*`를 server로 전달하고, 로컬 개발은 필요할 때
// `VITE_SERVER_API_URL`에 직접 gateway URL을 지정한다.
const API_BASE = (import.meta.env.VITE_SERVER_API_URL ?? '').replace(
  /\/+$/,
  ''
);
const BASE_PATH = '/v1';
let authRecovery: Promise<void> | null = null;

interface ServerEnvelope<T> {
  statusCode: string;
  message: string;
  data: T;
}

export class ServerApiError extends Error {
  readonly status: number;
  readonly statusCode: string;
  readonly success = false;
  readonly error: string;
  readonly raw?: unknown;

  constructor(
    status: number,
    statusCode: string,
    message: string,
    raw?: unknown
  ) {
    super(message);
    if (raw && typeof raw === 'object') {
      Object.assign(this, raw);
    }
    this.name = 'ServerApiError';
    this.status = status;
    this.statusCode = statusCode;
    this.error = statusCode;
    this.message = message;
    this.raw = raw;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new ServerApiError(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
  }
  return { Authorization: `Bearer ${token}` };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/** 공통 요청 코어 — 봉투 언랩 + 에러 정규화. extraHeaders로 인증 헤더 주입 여부를 가른다. */
async function requestCore<T>(
  path: string,
  options: RequestOptions,
  extraHeaders: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const res = await fetch(`${API_BASE}${BASE_PATH}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // 본문 없음(204 등)
  }

  if (!res.ok) {
    const env = payload as
      | (Partial<ServerEnvelope<unknown>> & { error?: string })
      | null;
    throw new ServerApiError(
      res.status,
      env?.statusCode ?? env?.error ?? String(res.status),
      env?.message || `요청 실패 (${res.status})`,
      payload
    );
  }

  // 204 No Content 또는 본문 없는 성공 응답: envelope이 없으므로 undefined 반환.
  if (res.status === 204 || payload === null) {
    return undefined as T;
  }

  return (payload as ServerEnvelope<T>).data;
}

/** 인증(Bearer) 첨부 요청 — 상담사용 일반 API. */
export async function serverRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  try {
    return await requestCore<T>(path, options, await authHeader());
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      try {
        await redirectToAuth();
      } catch {
        // 인증 오류 원본을 유지한다. redirect 실패가 API 오류를 덮으면 안 된다.
      }
    }
    throw error;
  }
}

async function redirectToAuth(): Promise<void> {
  if (authRecovery) return authRecovery;

  authRecovery = (async () => {
    const { useAuthStore } = await import('@/stores/authStore');
    useAuthStore.getState().clear();
    if (
      typeof window !== 'undefined' &&
      window.location.pathname !== ROUTES.AUTH
    ) {
      const authUrl = appendUtmParams(
        `${window.location.origin}${ROUTES.AUTH}`,
        useUtmStore.getState().shouldPropagateToUrl
          ? useUtmStore.getState().utmParams
          : ''
      );
      window.location.replace(authUrl);
    }
  })();
  try {
    await authRecovery;
  } finally {
    authRecovery = null;
  }
}

/**
 * 비인증 공개 요청 — @Public 엔드포인트(예: 내담자 공유 링크)용. Bearer 없이 호출한다.
 * 인증은 URL의 토큰 가드(SharedDocumentTokenGuard)가 담당.
 */
export async function serverRequestPublic<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  return requestCore<T>(path, options, {});
}
