import { supabase } from '@/lib/supabase';

/**
 * mindthos-server (NestJS) 전용 REST 클라이언트.
 *
 * - 인증: Supabase access token을 Bearer로 첨부 (서버가 GoTrue로 검증).
 * - 응답: 서버는 `{ statusCode, message, data }` 봉투로 응답하므로 data만 반환.
 */

// 배포 게이트웨이 절대 URL(끝 슬래시 제거). 비어 있으면 상대경로 → 로컬은 vite dev proxy가 forward.
const API_BASE = (import.meta.env.VITE_SERVER_API_URL ?? '').replace(
  /\/+$/,
  ''
);
const BASE_PATH = '/v1';

interface ServerEnvelope<T> {
  statusCode: string;
  message: string;
  data: T;
}

export class ServerApiError extends Error {
  readonly status: number;
  readonly statusCode: string;
  readonly raw?: unknown;

  constructor(
    status: number,
    statusCode: string,
    message: string,
    raw?: unknown
  ) {
    super(message);
    this.name = 'ServerApiError';
    this.status = status;
    this.statusCode = statusCode;
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

export async function serverRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
  };

  const res = await fetch(`${API_BASE}${BASE_PATH}${path}`, {
    method: options.method ?? 'GET',
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
    const env = payload as Partial<ServerEnvelope<unknown>> | null;
    throw new ServerApiError(
      res.status,
      env?.statusCode ?? String(res.status),
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
