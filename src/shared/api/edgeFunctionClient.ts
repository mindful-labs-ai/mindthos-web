import type { FunctionInvokeOptions } from '@supabase/supabase-js';

import { ROUTES } from '@/app/router/constants';
import { supabase } from '@/lib/supabase';

/**
 * 모든 Supabase Edge Function 엔드포인트를 한 곳에서 관리합니다.
 */
export const EDGE_FUNCTION_ENDPOINTS = {
  // 내담자 관련
  CLIENT: {
    CREATE: 'client/create',
    UPDATE: 'client',
    DELETE: 'client',
  },
  // 다회기 분석 관련
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
    RENEW: 'payment/renew',
    CANCEL: 'payment/cancel',
    CANCEL_UNDO: 'payment/cancel-undo',
    GET_CARD: 'payment/get-card',
  },
  // 가계도 관련
  GENOGRAM: {
    INIT: 'generate-family-summary/init',
    SUMMARY: 'generate-family-summary/summary',
  },
} as const;

interface FunctionErrorWithContext extends Error {
  context?: {
    json?: () => Promise<Record<string, unknown>>;
  };
}

/**
 * Supabase Edge Function을 호출하는 공용 유틸리티
 * Supabase SDK의 functions.invoke를 사용하여 자동 인증 및 세션 관리를 수행합니다.
 */
export async function callEdgeFunction<T>(
  endpoint: string,
  body?: FunctionInvokeOptions['body'] | null,
  options?: Pick<FunctionInvokeOptions, 'method' | 'headers'>
): Promise<T> {
  const functionPath = endpoint.startsWith('/')
    ? endpoint.substring(1)
    : endpoint;

  const { data, error } = await supabase.functions.invoke(functionPath, {
    method: options?.method || 'POST',
    headers: options?.headers,
    body: body ?? undefined,
  });

  if (error) {
    const status = error.status || 500;
    let errorData: Record<string, unknown> = {};

    try {
      const context =
        error instanceof Error && 'context' in error
          ? (error as FunctionErrorWithContext).context
          : undefined;
      if (context && typeof context.json === 'function') {
        errorData = await context.json();
      }
    } catch {
      // ignore
    }

    // 401: 토큰이 만료되었거나 유효하지 않은 경우 강제 로그아웃
    if (status === 401) {
      const { useAuthStore } = await import('@/stores/authStore');
      useAuthStore.getState().clear();
      window.location.href = ROUTES.AUTH;
    }

    throw {
      status,
      success: false,
      message: error.message || 'Edge Function 호출 중 오류가 생겼어요.',
      ...errorData,
    };
  }

  return data as T;
}
