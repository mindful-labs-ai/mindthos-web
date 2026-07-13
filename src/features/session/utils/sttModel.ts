/**
 * STT 모델별 기능 분기 술어 — 모델 리터럴 비교의 단일 소스.
 *
 * 모델 종류(SttModel): 'gemini-3'(레거시) | 'whisper' | 'basic' | 'advanced'
 * 신규 요청은 basic/advanced만 사용하고(SessionRequestSttModel),
 * gemini-3·whisper는 기존 저장 데이터 표시용으로만 남아 있다.
 *
 * 호출부는 stt_model이 없을 수 있으므로(null/undefined) 느슨한 입력을 받는다.
 */

type MaybeSttModel = string | null | undefined;

/** 타임스탬프가 없는 레거시 모델 여부 (gemini-3: start/end가 null) */
export const isLegacySttModel = (model: MaybeSttModel): boolean =>
  model === 'gemini-3';

/** '고급 축어록' 배지·라벨 대상 여부 (gemini-3·advanced) */
export const isAdvancedTranscriptModel = (model: MaybeSttModel): boolean =>
  model === 'gemini-3' || model === 'advanced';

/** 비언어(nv) 태그를 칩으로 렌더링하는 모델 여부 */
export const rendersNonverbalChips = (model: MaybeSttModel): boolean =>
  model === 'gemini-3' || model === 'advanced' || model === 'basic';

/** 비식별화(deid) 토글 지원 여부 (벤더 STT 모델: basic·advanced) */
export const supportsDeid = (model: MaybeSttModel): boolean =>
  model === 'basic' || model === 'advanced';
