/**
 * Session 생성 API Service
 * Backend: /functions/v1/session/create-background
 */

import type {
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
} from '../types';

const SUPABASE_URL = import.meta.env.VITE_WEBAPP_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_WEBAPP_SUPABASE_ANON_KEY;

/**
 * 백그라운드 세션 생성 API 호출
 */
export async function createSessionBackground(
  request: CreateSessionBackgroundRequest
): Promise<CreateSessionBackgroundResponse> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/session/create-background`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `세션 생성 실패: ${response.statusText}`
    );
  }

  const data: CreateSessionBackgroundResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || '세션 생성 중 오류가 발생했습니다.');
  }

  return data;
}
