import { supabase } from '@/lib/supabase';

/**
 * 모든 Supabase Edge Function 엔드포인트를 한 곳에서 관리합니다.
 */
export const EDGE_FUNCTION_ENDPOINTS = {
  // 세션 관련
  SESSION: {
    STATUS: (sessionId: string) => `session/status/${sessionId}`,
    PRESIGNED_URL: 'dev/session/presigned-url',
    UPLOAD_URL: 'dev/session/upload-url',
  },
  // 상담노트 관련
  PROGRESS_NOTE: {
    CREATE: 'dev/progress-note',
    ADD: 'dev/add-progress-note',
  },
  // 내담자 관련
  CLIENT: {
    CREATE: 'dev/client/create',
    UPDATE: 'dev/client',
    DELETE: 'dev/client',
  },
  // 내담자 분석 관련
  CLIENT_ANALYSIS: {
    CREATE: 'dev/client-analysis',
    STATUS: (clientId: string, version: number) =>
      `dev/client-analysis/status?client_id=${clientId}&version=${version}`,
  },
  // 결제 및 구독 관련
  PAYMENT: {
    ISSUE_BILLING_KEY: 'dev/payment/issue-billing-key',
    INIT_UPGRADE: 'dev/payment/init-upgrade',
    COMPLETE_UPGRADE: 'dev/payment/complete-upgrade',
    UPGRADE: 'dev/payment/upgrade',
    DELETE_CARD: 'dev/payment/delete-card',
    PREVIEW_UPGRADE: 'dev/payment/preview-upgrade',
    CHANGE_PLAN: 'dev/payment/change-plan',
    CANCEL: 'dev/payment/cancel',
    CANCEL_UNDO: 'dev/payment/cancel-undo',
  },
  // 인증 관련 (백엔드 전용 API)
  AUTH: {
    CHECK_USER_EXISTS: 'dev/auth/check-user-exists',
    ACCOUNT_DELETE: 'dev/auth/account-delete',
    RESEND_VERIFICATION: 'dev/auth/resend-verification',
  },
} as const;

/**
 * Supabase Edge Function을 호출하는 공용 유틸리티
 * Supabase SDK의 functions.invoke를 사용하여 자동 인증 및 세션 관리를 수행합니다.
 */
export async function callEdgeFunction<T>(
  endpoint: string,
  body?: any,
  options?: {
    method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
  }
): Promise<T> {
  const functionPath = endpoint.startsWith('/')
    ? endpoint.substring(1)
    : endpoint;

  const { data, error } = await supabase.functions.invoke(functionPath, {
    method: options?.method || 'POST',
    headers: options?.headers,
    body: body,
  });

  if (error) {
    const status = error.status || 500;
    let errorData: Record<string, unknown> = {};

    try {
      if (
        error instanceof Error &&
        'context' in (error as any) &&
        typeof (error as any).context?.json === 'function'
      ) {
        errorData = await (error as any).context.json();
      }
    } catch {
      // ignore
    }

    throw {
      status,
      success: false,
      message: error.message || 'Edge Function 호출 중 오류가 발생했습니다.',
      ...errorData,
    };
  }

  return data as T;
}
