import { supabase } from '@/lib/supabase';

/**
 * mindthos-server (NestJS) 전용 REST 클라이언트.
 *
 * - 인증: Supabase access token을 Bearer로 첨부 (서버가 GoTrue로 검증).
 * - 경로: `/v1/...` (dev는 vite proxy가 :3000으로 forward).
 * - 응답: 서버는 `{ statusCode, message, data }` 봉투로 응답하므로 data만 반환.
 */

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
    raw?: unknown,
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
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
  };

  const res = await fetch(`${BASE_PATH}${path}`, {
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
      payload,
    );
  }

  return (payload as ServerEnvelope<T>).data;
}
