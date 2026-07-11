import type { SupervisionSectionKey } from '@/features/client/types/supervisionReport.types';

/**
 * template_id별 고정 구조 보고서 설정.
 *
 * 머신이 산출한 JSON은 라벨/본문만 채우고, 섹션 제목·표시 순서·S3 표 헤더는
 * 이 config가 제공한다(매번 동일 레이아웃 보장).
 *
 * - 공유 섹션 제목(S0/S2/S4/S5)과 S3 컬럼1·2는 전 템플릿 공통.
 * - S1·S6 소제목, S3 컬럼3·4, S0 유무는 템플릿별로 다름
 *   (`다회기 분석 실험/_eval_results/normalized/client_templates_rows.csv`의
 *   각 prompt에서 `### SECTION N. [소제목]`과 SECTION 3 표 헤더를 파싱해 추출).
 * - 미지의 id는 id=1(자동감지) 구조로 default.
 */
export interface TemplateConfig {
  /** 표시 순서 (section0은 hasSection0=true인 템플릿에만 포함). */
  sectionOrder: SupervisionSectionKey[];
  /** 섹션별 "SECTION N. [소제목]" 제목. */
  titles: Record<SupervisionSectionKey, string>;
  /** S3 표 4컬럼 헤더 [회기, 발언, 이론 분석, 대안]. */
  s3Headers: [string, string, string, string];
}

/** 공통 섹션 제목 (S0/S2/S4/S5)과 S3 컬럼1·2. */
const SHARED_TITLES = {
  section0: 'SECTION 0. [이론적 접근 감지 결과]',
  section2: 'SECTION 2. [회기별 상세 평가 및 보완점]',
  section4: 'SECTION 4. [상담자를 위한 피드백 & 코칭]',
  section5: 'SECTION 5. [향후 상담 로드맵 및 가이드라인]',
} as const;

const S3_COL1 = '회기';
const S3_COL2 = '상담자/내담자 발언';

const FULL_ORDER: SupervisionSectionKey[] = [
  'section0',
  'section1',
  'section2',
  'section3',
  'section4',
  'section5',
  'section6',
];

const ORDER_NO_S0: SupervisionSectionKey[] = FULL_ORDER.filter(
  (k) => k !== 'section0'
);

interface TemplateMeta {
  hasSection0: boolean;
  s1Title: string;
  s6Title: string;
  s3Col3: string;
  s3Col4: string;
}

/**
 * CSV의 8개 ai_supervision prompt에서 추출한 메타.
 * 제목은 담백하게(★·rubric 괄호 제거) 정리.
 */
const TEMPLATE_META: Record<number, TemplateMeta> = {
  // id=1 이론 감지(자동) — S0 있음
  1: {
    hasSection0: true,
    s1Title: '사례 개념화 총평: 감지된 이론 관점',
    s6Title: '성찰과 심화를 위한 촉진적 질문',
    s3Col3: '이론적 심층 분석',
    s3Col4: '슈퍼바이저의 대안 반응',
  },
  // id=2 보웬
  2: {
    hasSection0: false,
    s1Title: '시스템 역동 총평: 불안의 기원과 흐름',
    s6Title: '가계도 탐색을 위한 확장 질문',
    s3Col3: '보웬 이론적 심층 분석',
    s3Col4: '슈퍼바이저의 대안 질문',
  },
  // id=3 CBT
  3: {
    hasSection0: false,
    s1Title: '사례 개념화 총평: 인지와 행동의 악순환',
    s6Title: '개념화 심화를 위한 하향 화살표 질문',
    s3Col3: 'CBT 이론적 심층 분석',
    s3Col4: '슈퍼바이저의 대안 질문',
  },
  // id=4 인간중심
  4: {
    hasSection0: false,
    s1Title: '사례 개념화 총평: 가치의 조건화와 자기 불일치',
    s6Title: '성찰과 심화를 위한 촉진적 질문',
    s3Col3: '인간중심 이론적 심층 분석',
    s3Col4: '슈퍼바이저의 대안 반응',
  },
  // id=5 ACT
  5: {
    hasSection0: false,
    s1Title: '사례 개념화 총평: 심리적 경직성의 악순환',
    s6Title: '성찰과 심화를 위한 촉진적 질문',
    s3Col3: 'ACT 이론적 심층 분석',
    s3Col4: '슈퍼바이저의 대안 반응',
  },
  // id=6 사티어
  6: {
    hasSection0: false,
    s1Title: '사례 개념화 총평: 생존을 넘어 성장으로',
    s6Title: '성찰과 심화를 위한 촉진적 질문',
    s3Col3: '사티어 이론적 심층 분석',
    s3Col4: '슈퍼바이저의 대안 반응',
  },
  // id=7 해결중심(SFBT)
  7: {
    hasSection0: false,
    s1Title: '사례 개념화 총평: 문제가 아닌 해결을 향하여',
    s6Title: '성찰과 심화를 위한 촉진적 질문',
    s3Col3: 'SFBT 이론적 심층 분석',
    s3Col4: '슈퍼바이저의 대안 반응',
  },
  // id=8 미누친
  8: {
    hasSection0: false,
    s1Title: '사례 개념화 총평: 구조적 진단과 지도',
    s6Title: '성찰과 심화를 위한 촉진적 질문',
    s3Col3: '구조적 이론 심층 분석',
    s3Col4: '슈퍼바이저의 대안 반응',
  },
};

function buildConfig(meta: TemplateMeta): TemplateConfig {
  return {
    sectionOrder: meta.hasSection0 ? FULL_ORDER : ORDER_NO_S0,
    titles: {
      section0: SHARED_TITLES.section0,
      section1: `SECTION 1. [${meta.s1Title}]`,
      section2: SHARED_TITLES.section2,
      section3: 'SECTION 3. [축어록 정밀 분석]',
      section4: SHARED_TITLES.section4,
      section5: SHARED_TITLES.section5,
      section6: `SECTION 6. [${meta.s6Title}]`,
    },
    s3Headers: [S3_COL1, S3_COL2, meta.s3Col3, meta.s3Col4],
  };
}

/**
 * templateId에 대한 고정 구조 config 반환.
 * 미지의 id(또는 undefined)는 id=1(자동감지) 구조로 default.
 */
export function getTemplateConfig(templateId?: number): TemplateConfig {
  const meta =
    (templateId != null && TEMPLATE_META[templateId]) || TEMPLATE_META[1];
  return buildConfig(meta);
}
