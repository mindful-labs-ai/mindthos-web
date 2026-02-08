/**
 * Genogram AI 생성 서비스
 * Vercel API Route를 통해 상담 기록으로부터 가계도 생성
 */

import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

/**
 * API가 반환하는 Genogram 데이터
 * 캔버스(GenogramPage)에서 직접 사용하는 형식
 */
export type GenogramData = Record<string, unknown>;

export interface GenerateFamilySummaryResponse {
  success: true;
  data: {
    client_id: string;
    family_summary: string;
    genogram: GenogramData;
    stats: {
      total_transcripts: number;
      newly_summarized: number;
      from_cache: number;
    };
  };
}

export interface GenerateFamilySummaryError {
  success: false;
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'NO_TRANSCRIPTS'
      | 'PIPELINE_ERROR'
      | 'UNAUTHORIZED';
    message: string;
  };
}

export type GenerateFamilySummaryResult =
  | GenerateFamilySummaryResponse
  | GenerateFamilySummaryError;

// ─────────────────────────────────────────────────────────────────────────────
// API 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vercel API Route를 호출하여 가계도 생성
 * @param clientId 내담자 UUID
 * @param forceRefresh true면 캐시 무시하고 전체 재생성
 */
export async function generateFamilySummary(
  clientId: string,
  forceRefresh = true
): Promise<GenerateFamilySummaryResult> {
  try {
    // Supabase 세션에서 액세스 토큰 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '로그인이 필요합니다.',
        },
      };
    }

    const response = await fetch('/api/genogram/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        client_id: clientId,
        force_refresh: forceRefresh,
      }),
    });

    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('[genogramAIService] Non-JSON response:', text);
      return {
        success: false,
        error: {
          code: 'PIPELINE_ERROR',
          message: `서버 응답 오류 (${response.status}): ${text.substring(0, 200)}`,
        },
      };
    }

    const data = (await response.json()) as GenerateFamilySummaryResult;
    return data;
  } catch (error) {
    const err = error as { message?: string };
    return {
      success: false,
      error: {
        code: 'PIPELINE_ERROR',
        message: err.message || '가계도 생성 중 오류가 발생했습니다.',
      },
    };
  }
}
