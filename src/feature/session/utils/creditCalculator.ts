/**
 * 크레딧 계산 유틸리티
 * 백엔드 로직과 동일한 계산식 사용
 */

/**
 * 상담노트 생성 크레딧 (고정값)
 */
export const PROGRESS_NOTE_CREDIT = 20;

/**
 * STT 크레딧 계산
 * - 일반 축어록 (basic): 1분당 1 크레딧
 * - 고급 축어록 (advanced): 1분당 1.5 크레딧 (반내림 처리)
 */
export function calculateSTTCredit(
  durationSeconds: number,
  transcribeType: 'basic' | 'advanced'
): number {
  const durationMinutes = Math.ceil(durationSeconds / 60);

  if (transcribeType === 'basic') {
    return durationMinutes * 1;
  } else {
    // advanced: 1분당 1.5 크레딧, 반내림
    return Math.floor(durationMinutes * 1.5);
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
