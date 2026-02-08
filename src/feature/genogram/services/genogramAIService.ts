/**
 * Genogram AI 생성 서비스
 * Vercel API Route를 통해 상담 기록으로부터 가계도 생성
 *
 * 파이프라인:
 * 1. API(summary.ts) 호출 → AI 원본 JSON 응답 받기
 * 2. aiJsonConverter로 좌표 계산 및 캔버스 변환
 * 3. DB 저장 및 프론트 렌더링
 */

import type { SerializedGenogram } from '@/genogram/core/models/genogram';
import { supabase } from '@/lib/supabase';

import {
  type AIGenogramOutput,
  convertAIJsonToCanvas,
  isValidAIJson,
} from '../utils/aiJsonConverter';

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

/** API가 반환하는 AI 원본 응답 */
export interface GenerateAIOutputResponse {
  success: true;
  data: {
    client_id: string;
    ai_output: AIGenogramOutput;
    stats: {
      total_transcripts: number;
    };
  };
}

export interface GenerateAIOutputError {
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

export type GenerateAIOutputResult =
  | GenerateAIOutputResponse
  | GenerateAIOutputError;

/** 최종 반환 타입 (캔버스 변환 후) */
export interface GenerateFamilySummaryResponse {
  success: true;
  data: {
    client_id: string;
    genogram: SerializedGenogram;
    ai_output: AIGenogramOutput; // 디버깅용 원본 데이터
    stats: {
      total_transcripts: number;
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
      | 'UNAUTHORIZED'
      | 'CONVERSION_ERROR';
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
 * Vercel API Route를 호출하여 AI 분석 결과 받기 (원본 JSON)
 * @param clientId 내담자 UUID
 */
async function fetchAIOutput(
  clientId: string
): Promise<GenerateAIOutputResult> {
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
    }),
  });

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

  return (await response.json()) as GenerateAIOutputResult;
}

/**
 * Genograms 테이블에 저장
 * @param userId users 테이블의 bigint ID (string으로 전달)
 */
async function saveGenogramToDatabase(
  clientId: string,
  userId: string,
  genogram: SerializedGenogram
): Promise<void> {
  const { error } = await supabase.from('genograms').upsert(
    {
      client_id: clientId,
      user_id: parseInt(userId, 10),
      data: genogram,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'client_id',
    }
  );

  if (error) {
    throw new Error(`가계도 저장 실패: ${error.message}`);
  }
}

/**
 * 가계도 생성 메인 함수
 *
 * 1. API 호출 → AI 원본 JSON 받기
 * 2. aiJsonConverter로 좌표 계산 및 캔버스 변환
 * 3. DB 저장
 *
 * @param clientId 내담자 UUID
 * @param userId users 테이블의 bigint ID (string으로 전달, DB 저장 시 필요)
 * @param saveToDb true면 DB에 저장 (기본값: true)
 */
export async function generateFamilySummary(
  clientId: string,
  userId: string,
  saveToDb = true
): Promise<GenerateFamilySummaryResult> {
  try {
    console.log('[genogramAIService] 시작:', clientId);

    // 1. API 호출하여 AI 분석 결과 받기
    console.log('[genogramAIService] AI 분석 요청...');
    const apiResult = await fetchAIOutput(clientId);

    if (!apiResult.success) {
      return apiResult;
    }

    const { ai_output, stats } = apiResult.data;

    // 2. AI 응답 유효성 검사
    if (!isValidAIJson(ai_output)) {
      console.error('[genogramAIService] Invalid AI output:', ai_output);
      return {
        success: false,
        error: {
          code: 'CONVERSION_ERROR',
          message: 'AI 응답 형식이 올바르지 않습니다.',
        },
      };
    }

    console.log('[genogramAIService] AI 분석 완료:', {
      subjects: ai_output.subjects.length,
      partners: ai_output.partners.length,
      influences: ai_output.influences.length,
      nuclearFamilies: ai_output.nuclearFamilies.length,
    });

    // 3. aiJsonConverter로 좌표 계산 및 캔버스 변환
    console.log('[genogramAIService] 좌표 계산 및 캔버스 변환...');
    const genogram = convertAIJsonToCanvas(ai_output);

    console.log('[genogramAIService] 변환 완료:', {
      subjects: genogram.subjects.length,
      connections: genogram.connections.length,
    });

    // 4. DB 저장 (옵션)
    if (saveToDb) {
      console.log('[genogramAIService] DB 저장...');
      await saveGenogramToDatabase(clientId, userId, genogram);
      console.log('[genogramAIService] DB 저장 완료');
    }

    return {
      success: true,
      data: {
        client_id: clientId,
        genogram,
        ai_output, // 디버깅용
        stats,
      },
    };
  } catch (error) {
    const err = error as { message?: string };
    console.error('[genogramAIService] 오류:', err);
    return {
      success: false,
      error: {
        code: 'PIPELINE_ERROR',
        message: err.message || '가계도 생성 중 오류가 발생했습니다.',
      },
    };
  }
}

/**
 * AI 원본 JSON만 가져오기 (변환 없이)
 * 디버깅 및 테스트용
 */
export async function fetchRawAIOutput(
  clientId: string
): Promise<GenerateAIOutputResult> {
  return fetchAIOutput(clientId);
}

/**
 * AI JSON을 캔버스 형식으로 변환 (저장 없이)
 * 미리보기 등에 사용
 */
export function convertToCanvas(
  aiOutput: AIGenogramOutput
): SerializedGenogram {
  return convertAIJsonToCanvas(aiOutput);
}
