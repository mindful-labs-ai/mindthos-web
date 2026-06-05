/**
 * 크레딧 계산 유틸리티
 * 백엔드 로직과 동일한 계산식 사용
 */

import {
  SESSION_CREATE_NOTE_CREDIT,
  STT_CREDIT,
} from '@/shared/constants/credit';

/**
 * 세션 자동 생성 흐름에 포함되는 상담노트 크레딧 (고정값, 정책상 무료 0).
 * 중앙 상수(SESSION_CREATE_NOTE_CREDIT)에서 가져온다. 단독 상담노트 생성·재생성
 * 비용(CREDIT_COST.PROGRESS_NOTE=10)과 다른 것은 의도된 정책이다.
 */
export const PROGRESS_NOTE_CREDIT = SESSION_CREATE_NOTE_CREDIT;

/**
 * STT 크레딧 계산
 * - 최소 30분 기준: 1~30분은 30 크레딧 (basic) 또는 45 크레딧 (advanced)
 * - 31분부터: 1분당 1 크레딧 (basic) 또는 1분당 1.5 크레딧 (advanced) 추가
 */
export function calculateSTTCredit(
  durationSeconds: number,
  transcribeType: 'basic' | 'advanced'
): number {
  const durationMinutes = Math.ceil(durationSeconds / 60);
  const MIN_MINUTES = STT_CREDIT.MIN_MINUTES;
  const ADVANCED_MULTIPLIER = STT_CREDIT.ADVANCED_MULTIPLIER;

  if (transcribeType === 'basic') {
    // basic: 최소 30 크레딧, 31분부터 1분당 1 크레딧
    return Math.max(durationMinutes, MIN_MINUTES);
  } else {
    // advanced: 최소 45 크레딧 (30분 * 1.5), 31분부터 1분당 1.5 크레딧 (반내림)
    const minCredit = Math.floor(MIN_MINUTES * ADVANCED_MULTIPLIER);
    return Math.max(
      Math.floor(durationMinutes * ADVANCED_MULTIPLIER),
      minCredit
    );
  }
}

/**
 * 세션 생성에 필요한 총 크레딧 계산
 */
export function calculateTotalCredit(params: {
  uploadType: 'audio' | 'pdf' | 'direct';
  transcribeType?: 'basic' | 'advanced';
  durationSeconds?: number;
}): {
  totalCredit: number;
  sttCredit?: number;
  noteCredit: number;
} {
  const { uploadType, transcribeType, durationSeconds } = params;

  if (uploadType === 'audio' && transcribeType && durationSeconds) {
    const sttCredit = calculateSTTCredit(durationSeconds, transcribeType);
    return {
      totalCredit: sttCredit + PROGRESS_NOTE_CREDIT,
      sttCredit,
      noteCredit: PROGRESS_NOTE_CREDIT,
    };
  }

  // pdf 또는 direct
  return {
    totalCredit: PROGRESS_NOTE_CREDIT,
    noteCredit: PROGRESS_NOTE_CREDIT,
  };
}
