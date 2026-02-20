import { supabase } from '@/lib/supabase';

/**
 * 모든 Supabase Edge Function 엔드포인트를 한 곳에서 관리합니다.
 */
export const EDGE_FUNCTION_ENDPOINTS = {
  // 세션 관련
  SESSION: {
    STATUS: (sessionId: string) => `session/status/${sessionId}`,
    PRESIGNED_URL: 'session/presigned-url',
    UPLOAD_URL: 'session/upload-url',
    HAND_WRITTEN: 'session/hand-written',
  },
  // 상담노트 관련
  PROGRESS_NOTE: {
    CREATE: 'progress-note',
    ADD: 'add-progress-note',
  },
  // 내담자 관련
  CLIENT: {
    CREATE: 'client/create',
    UPDATE: 'client',
    DELETE: 'client',
  },
  // 내담자 분석 관련
  CLIENT_ANALYSIS: {
    CREATE: 'client-analysis',
    STATUS: (clientId: string, version: number) =>
      `client-analysis/status?client_id=${clientId}&version=${version}`,
  },
  // 결제 및 구독 관련
  PAYMENT: {
    ISSUE_BILLING_KEY: 'payment/issue-billing-key',
    REGISTER_CARD: 'payment/register-card',
    INIT_UPGRADE: 'payment/init-upgrade',
    COMPLETE_UPGRADE: 'payment/complete-upgrade',
    UPGRADE: 'payment/upgrade',
    DELETE_CARD: 'payment/delete-card',
    PREVIEW_UPGRADE: 'payment/preview-upgrade',
    CHANGE_PLAN: 'payment/change-plan',
    CANCEL: 'payment/cancel',
    CANCEL_UNDO: 'payment/cancel-undo',
    GET_CARD: 'payment/get-card',
  },
  // 인증 관련 (백엔드 전용 API)
  AUTH: {
    CHECK_USER_EXISTS: 'auth/check-user-exists',
    ACCOUNT_DELETE: 'auth/account-delete',
    RESEND_VERIFICATION: 'auth/resend-verification',
  },
  // 약관 관련
  TERMS: {
    LIST: 'terms/list',
    CHECK: 'terms/check',
    AGREE: 'terms/agree',
  },
  // 가계도 관련
  GENOGRAM: {
    INIT: 'generate-family-summary/init',
    SUMMARY: 'generate-family-summary/summary',
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
