/**
 * v2 사례개념화 노트 JSON 구조 (note-layer Edge Function 출력).
 *
 * 변경 이력:
 *  - 2026-04-28: 다문장 분석 필드를 모두 string[]로 전환.
 *    phase1.theory.confidence 제거, evidence는 string[].
 *    phase4.supervision[].evaluation/rationale 제거 → comment(string[]).
 *    phase2.maintaining_factors.cycle: string → string[] (순환 단계).
 *
 * 호환성:
 *  - 기존 v2 노트(필드가 string)도 화면이 깨지지 않도록 각 블록은
 *    `toLines()` 헬퍼로 string|string[] 양쪽 입력을 받습니다.
 *  - 따라서 타입 자체는 `string | string[]` 유니온으로 두어 양쪽 페이로드를
 *    모두 안전하게 받습니다. 신규 노트는 항상 string[]를 출력합니다.
 */
export interface NoteV2Output {
  phase1: {
    theory: {
      primary: string;
      secondary: string | null;
      /** 식별 근거. 새 노트는 string[], 기존 노트 호환을 위해 string도 허용. */
      evidence: string | string[];
    };
    presenting_issue: string;
    safety_assessment: {
      suicide_self_harm: string;
      harm_to_others: string;
      abuse_neglect: string;
      immediate_action: string;
    };
  };
  phase2: {
    precipitants: string | string[];
    core_dynamics: string | string[];
    maintaining_factors: {
      internal: string | string[];
      environmental: string | string[];
      /**
       * 악순환 패턴.
       * 새 노트: string[] (사이클 단계 3~5개, 마지막→첫 단계 순환).
       * 기존 노트: "A → B → C → A" 형태의 string도 들어올 수 있어 호환 처리.
       */
      cycle: string | string[];
    };
    theory_section: {
      title: string;
      subsections: Array<{
        subtitle: string;
        content: string | string[];
      }>;
    };
    developmental: string | string[];
    strengths: string | string[];
  };
  phase3: {
    key_quotes: Array<{
      /** 1~3문장 / 최소 30자 권장의 맥락 있는 발췌. */
      quote: string;
      /**
       * 임상적 의미 분석 단락 배열 (3~5문장 권장).
       * 기존 v2 노트(string)도 호환되도록 string | string[] 유니온.
       */
      meaning: string | string[];
    }>;
    interventions: {
      major: string | string[];
      theoretical_fit: string | string[];
      evidence: string | string[];
    };
    observations: {
      insight_level: string;
      motivation: string;
      emotional_state: string | string[];
    };
  };
  phase4: {
    roadmap: {
      admin_plan: string;
      priorities: string[];
      suggested_questions: Array<{
        question: string;
        rationale: string;
      }>;
      suggested_techniques: Array<{
        name: string;
        description: string | string[];
      }>;
      referral: string | null;
    };
    supervision: Array<{
      quote: string;
      alternative: string;
      /** 통합 코멘트. 신규 필드. quote+alternative 통합 평가. */
      comment?: string | string[];
      /** @deprecated 2026-04-28 — 기존 노트 호환용으로만 받음. comment로 통합. */
      evaluation?: string;
      /** @deprecated 2026-04-28 — 기존 노트 호환용으로만 받음. comment로 통합. */
      rationale?: string;
    }>;
    overall_comment: string | string[];
  };
}

/** v2 노트인지 판별 + 파싱. 최상위 phase1~4 키 존재 여부로만 판단. */
export function tryParseNoteV2(summary: string): NoteV2Output | null {
  try {
    const parsed = JSON.parse(summary);
    if (parsed?.phase1 && parsed?.phase2 && parsed?.phase3 && parsed?.phase4) {
      return parsed as NoteV2Output;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * string | string[] | null | undefined → string[].
 * 모든 분석 블록이 사용. 빈 문자열·빈 배열은 빈 배열로 정규화.
 *
 * 기존 v2 노트 호환을 위해 단일 string이 들어오면:
 *  - 줄바꿈(\n\n 또는 \n)으로 단락 분리.
 *  - 분리된 항목이 하나뿐이면 그대로 단일 원소 배열.
 */
export function toLines(value: string | string[] | null | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0);
  }
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n{2,}|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * cycle 전용 정규화.
 * 기존 노트의 "A → B → C → A" 형태 string을 단계 배열로 변환.
 * - 화살표(→ / ->) 또는 줄바꿈으로 split.
 * - 마지막 단계가 첫 단계와 동일하면 마지막 항목 제거 (반복 표시 제거).
 */
export function toCycleSteps(
  value: string | string[] | null | undefined
): string[] {
  if (Array.isArray(value)) return toLines(value);
  if (value == null) return [];
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  const steps = trimmed
    .split(/\s*(?:→|->|\n+)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    steps.length >= 2 &&
    steps[steps.length - 1] === steps[0]
  ) {
    steps.pop();
  }
  return steps;
}
