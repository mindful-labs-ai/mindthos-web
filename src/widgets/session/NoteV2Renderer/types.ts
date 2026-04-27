/** v2 사례개념화 노트 JSON 구조 (note-layer Edge Function 출력) */
export interface NoteV2Output {
  phase1: {
    theory: {
      primary: string;
      secondary: string | null;
      confidence: string;
      evidence: string;
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
    precipitants: string;
    core_dynamics: string;
    maintaining_factors: {
      internal: string;
      environmental: string;
      cycle: string;
    };
    theory_section: {
      title: string;
      subsections: Array<{
        subtitle: string;
        content: string;
      }>;
    };
    developmental: string;
    strengths: string;
  };
  phase3: {
    key_quotes: Array<{
      quote: string;
      meaning: string;
    }>;
    interventions: {
      major: string;
      theoretical_fit: string;
      evidence: string;
    };
    observations: {
      insight_level: string;
      motivation: string;
      emotional_state: string;
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
        description: string;
      }>;
      referral: string | null;
    };
    supervision: Array<{
      quote: string;
      evaluation: string;
      alternative: string;
      rationale: string;
    }>;
    overall_comment: string;
  };
}

/** v2 노트인지 판별 + 파싱 */
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
