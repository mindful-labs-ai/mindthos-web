/**
 * 마음토스 사용자 노출 도메인 어휘 단일 출처(Single Source of Truth).
 *
 * 용도:
 * - 도메인 핵심 단어가 코드 곳곳에 직접 박혀 흔들리지 않도록 모음.
 * - 향후 브랜딩 변경 시 본 파일만 수정하면 전체 적용 가능.
 *
 * 원칙:
 * - "현재 확정된 표기"만 둠. 변경 후보(예: 비식별화 → 이름 가리기)는 결정된 뒤 반영.
 * - 의미 분화된 동사(`추가/만들기/생성/등록`)는 의도가 다르므로 상수화하지 않음.
 */

// 사용자 호칭
export const TERM_COUNSELOR = '상담사'; // 본문·설명·마케팅
export const TERM_COUNSELOR_HONORIFIC = '상담사님'; // 사용자에게 직접 말 걸 때

// 피상담자
export const TERM_COUNSELEE = '내담자';

// 핵심 엔티티
export const TERM_SESSION_RECORD = '상담 기록';
export const TERM_PROGRESS_NOTE = '상담노트'; // 붙여 씀
export const TERM_TRANSCRIPT = '축어록';
export const TERM_GENOGRAM = '가계도';
export const TERM_CASE_CONCEPTUALIZATION = '사례 개념화';
export const TERM_MULTI_SESSION_ANALYSIS = '다회기 분석';
export const TERM_AI_SUPERVISION = 'AI 슈퍼비전';
export const TERM_SUPERVISOR = '슈퍼바이저';

// 결제·플랜
export const TERM_PLAN = '플랜';
export const TERM_CREDIT = '크레딧';
export const TERM_SUBSCRIPTION = '구독';
export const TERM_CANCEL = '해지';
export const TERM_UPGRADE = '상위 플랜으로 변경';
export const TERM_DOWNGRADE = '하위 플랜으로 변경';

// 빈 상태 패턴
export const EMPTY_STATE_SUFFIX = '없어요'; // ~없어요 톤
