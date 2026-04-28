import React from 'react';

import {
  CoreDynamicsBlock,
  DevelopmentalBlock,
  InterventionsBlock,
  KeyQuotesBlock,
  MaintainingFactorsBlock,
  ObservationsBlock,
  OverallBlock,
  PrecipitantsBlock,
  PresentingIssueBlock,
  RoadmapBlock,
  SafetyAssessmentBlock,
  StrengthsBlock,
  SupervisionBlock,
  TheoryBlock,
  TheorySectionBlock,
  serializeCoreDynamics,
  serializeDevelopmental,
  serializeInterventions,
  serializeKeyQuotes,
  serializeMaintaining,
  serializeObservations,
  serializeOverall,
  serializePrecipitants,
  serializePresentingIssue,
  serializeRoadmap,
  serializeSafety,
  serializeStrengths,
  serializeSupervision,
  serializeTheory,
  serializeTheorySection,
} from './blocks';
import { NumberedSection } from './NumberedSection';
import { PhaseSection } from './PhaseSection';
import type { NoteV2Output } from './types';

export interface NoteV2RendererHandle {
  /** DOM에서 편집된 값을 추출하여 JSON 문자열로 반환 */
  getEditedContent: () => string;
}

interface NoteV2RendererProps {
  note: NoteV2Output;
  editable?: boolean;
}

export const NoteV2Renderer = React.forwardRef<
  NoteV2RendererHandle,
  NoteV2RendererProps
>(function NoteV2Renderer({ note, editable }, ref) {
  const { phase1, phase2, phase3, phase4 } = note;
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    getEditedContent: () => {
      if (!containerRef.current) return JSON.stringify(note);
      return JSON.stringify(extractNoteV2(containerRef.current, note));
    },
  }));

  return (
    <div ref={containerRef} className="space-y-10">
      {/* 총평 (최상단) */}
      <PhaseSection
        phase="Overall"
        title="총평"
        anchorId="note-overall"
        copyText={serializeOverall(phase4.overall_comment)}
        editable={editable}
      >
        <OverallBlock value={phase4.overall_comment} editable={editable} />
      </PhaseSection>

      {/* Phase 1: 기초 사정 */}
      <PhaseSection
        phase="Phase 1"
        title="기초 사정"
        anchorId="note-phase-1"
        copyText={serializePhase1(phase1)}
        editable={editable}
      >
        <NumberedSection
          number={0}
          title="적용된 상담 이론"
          anchorId="note-sec-0"
          copyText={serializeTheory(phase1.theory)}
          editable={editable}
        >
          <TheoryBlock theory={phase1.theory} editable={editable} />
        </NumberedSection>
        <NumberedSection
          number={1}
          title="상담 주제"
          anchorId="note-sec-1"
          copyText={serializePresentingIssue(phase1.presenting_issue)}
          editable={editable}
        >
          <PresentingIssueBlock
            value={phase1.presenting_issue}
            editable={editable}
          />
        </NumberedSection>
        <NumberedSection
          number={2}
          title="안전 사정"
          anchorId="note-sec-2"
          copyText={serializeSafety(phase1.safety_assessment)}
          editable={editable}
        >
          <SafetyAssessmentBlock
            safety={phase1.safety_assessment}
            editable={editable}
          />
        </NumberedSection>
      </PhaseSection>

      {/* Phase 2: 사례 개념화 */}
      <PhaseSection
        phase="Phase 2"
        title="사례 개념화"
        anchorId="note-phase-2"
        copyText={serializePhase2(phase2)}
        editable={editable}
      >
        <NumberedSection
          number={3}
          title="촉발 요인"
          anchorId="note-sec-3"
          copyText={serializePrecipitants(phase2.precipitants)}
          editable={editable}
        >
          <PrecipitantsBlock value={phase2.precipitants} editable={editable} />
        </NumberedSection>
        <NumberedSection
          number={4}
          title="핵심 역동"
          anchorId="note-sec-4"
          copyText={serializeCoreDynamics(phase2.core_dynamics)}
          editable={editable}
        >
          <CoreDynamicsBlock value={phase2.core_dynamics} editable={editable} />
        </NumberedSection>
        <NumberedSection
          number={5}
          title="유지 요인"
          anchorId="note-sec-5"
          copyText={serializeMaintaining(phase2.maintaining_factors)}
          editable={editable}
        >
          <MaintainingFactorsBlock
            maintaining={phase2.maintaining_factors}
            editable={editable}
          />
        </NumberedSection>
        <NumberedSection
          title="이론 고유 분석"
          hint={phase1.theory.primary || undefined}
          anchorId="note-sec-theory"
          copyText={serializeTheorySection(phase2.theory_section)}
          editable={editable}
        >
          <TheorySectionBlock
            section={phase2.theory_section}
            editable={editable}
          />
        </NumberedSection>
        <NumberedSection
          number={6}
          title="발달적 맥락"
          anchorId="note-sec-6"
          copyText={serializeDevelopmental(phase2.developmental)}
          editable={editable}
        >
          <DevelopmentalBlock
            value={phase2.developmental}
            editable={editable}
          />
        </NumberedSection>
        <NumberedSection
          number={7}
          title="강점 및 자원"
          anchorId="note-sec-7"
          copyText={serializeStrengths(phase2.strengths)}
          editable={editable}
        >
          <StrengthsBlock value={phase2.strengths} editable={editable} />
        </NumberedSection>
      </PhaseSection>

      {/* Phase 3: 임상 근거 */}
      <PhaseSection
        phase="Phase 3"
        title="임상 근거"
        anchorId="note-phase-3"
        copyText={serializePhase3(phase3)}
        editable={editable}
      >
        <NumberedSection
          number={8}
          title="내담자 핵심 발언"
          anchorId="note-sec-8"
          editable={editable}
        >
          <KeyQuotesBlock quotes={phase3.key_quotes} editable={editable} />
        </NumberedSection>
        <NumberedSection
          number={9}
          title="금회기 개입 분석"
          anchorId="note-sec-9"
          copyText={serializeInterventions(phase3.interventions)}
          editable={editable}
        >
          <InterventionsBlock
            interventions={phase3.interventions}
            editable={editable}
          />
        </NumberedSection>
        <NumberedSection
          number={10}
          title="내담자 관찰 소견"
          anchorId="note-sec-10"
          copyText={serializeObservations(phase3.observations)}
          editable={editable}
        >
          <ObservationsBlock
            observations={phase3.observations}
            editable={editable}
          />
        </NumberedSection>
      </PhaseSection>

      {/* Phase 4: 전략 및 슈퍼비전 */}
      <PhaseSection
        phase="Phase 4"
        title="전략 및 슈퍼비전"
        anchorId="note-phase-4"
        copyText={serializePhase4(phase4)}
        editable={editable}
      >
        <NumberedSection
          number={11}
          title="다음 회기 로드맵"
          anchorId="note-sec-11"
          copyText={serializeRoadmap(phase4.roadmap)}
          editable={editable}
        >
          <RoadmapBlock roadmap={phase4.roadmap} editable={editable} />
        </NumberedSection>
        <NumberedSection
          number={12}
          title="간이 슈퍼비전"
          anchorId="note-sec-12"
          copyText={serializeSupervision(phase4.supervision)}
          editable={editable}
        >
          <SupervisionBlock
            supervision={phase4.supervision}
            editable={editable}
          />
        </NumberedSection>
      </PhaseSection>
    </div>
  );
});

// ──────────────────────────────────────────────
// 추출 (편집 모드 → JSON)
// ──────────────────────────────────────────────

/**
 * 추출 시점에 string[]로 재구성해야 하는 path 화이트리스트.
 * 와일드카드 `*` 는 임의의 인덱스(숫자) 또는 임의의 키 1개와 매치.
 */
const ARRAY_FIELD_PATHS: ReadonlyArray<string> = [
  'phase1.theory.evidence',
  'phase2.precipitants',
  'phase2.core_dynamics',
  'phase2.maintaining_factors.internal',
  'phase2.maintaining_factors.environmental',
  'phase2.theory_section.subsections.*.content',
  'phase2.developmental',
  'phase2.strengths',
  'phase3.key_quotes.*.meaning',
  'phase3.interventions.major',
  'phase3.interventions.theoretical_fit',
  'phase3.interventions.evidence',
  'phase3.observations.emotional_state',
  'phase4.roadmap.suggested_techniques.*.description',
  'phase4.supervision.*.comment',
  'phase4.overall_comment',
];

function pathMatches(pattern: string, path: string): boolean {
  const ps = pattern.split('.');
  const xs = path.split('.');
  if (ps.length !== xs.length) return false;
  for (let i = 0; i < ps.length; i++) {
    if (ps[i] === '*') continue;
    if (ps[i] !== xs[i]) return false;
  }
  return true;
}

function isArrayPath(path: string): boolean {
  return ARRAY_FIELD_PATHS.some((p) => pathMatches(p, path));
}

function extractParagraphs(el: HTMLElement): string[] {
  const result: string[] = [];
  const paragraphs = el.querySelectorAll(':scope > p');
  if (paragraphs.length > 0) {
    paragraphs.forEach((p) => {
      const t = p.textContent?.trim() ?? '';
      if (t) result.push(t);
    });
    return result;
  }
  const raw = el.textContent ?? '';
  return raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: string | string[]
) {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = /^\d+$/.test(keys[i]) ? Number(keys[i]) : keys[i];
    let next = current[key as string];
    if (next == null) {
      const nextKey = keys[i + 1];
      next = /^\d+$/.test(nextKey) ? [] : {};
      current[key as string] = next;
    }
    current = next as Record<string, unknown>;
  }
  const lastKey = /^\d+$/.test(keys[keys.length - 1])
    ? Number(keys[keys.length - 1])
    : keys[keys.length - 1];
  current[lastKey as string] = value;
}

function extractNoteV2(
  container: HTMLElement,
  original: NoteV2Output
): NoteV2Output {
  const note = structuredClone(original);
  container.querySelectorAll<HTMLElement>('[data-note-path]').forEach((el) => {
    const path = el.dataset.notePath;
    if (!path) return;
    if (isArrayPath(path)) {
      const lines = extractParagraphs(el);
      setNestedValue(note as unknown as Record<string, unknown>, path, lines);
    } else {
      const value = el.textContent?.trim() ?? '';
      setNestedValue(note as unknown as Record<string, unknown>, path, value);
    }
  });
  return note;
}

// ──────────────────────────────────────────────
// 직렬화 (복사·serialize)
// ──────────────────────────────────────────────

function serializePhase1(p: NoteV2Output['phase1']): string {
  return [
    `## Phase 1: 기초 사정`,
    ``,
    `### 0. 적용된 상담 이론`,
    serializeTheory(p.theory),
    ``,
    `### 1. 상담 주제`,
    serializePresentingIssue(p.presenting_issue),
    ``,
    `### 2. 안전 사정`,
    serializeSafety(p.safety_assessment),
  ].join('\n');
}

function serializePhase2(p: NoteV2Output['phase2']): string {
  return [
    `## Phase 2: 사례 개념화`,
    ``,
    `### 3. 촉발 요인`,
    serializePrecipitants(p.precipitants),
    ``,
    `### 4. 핵심 역동`,
    serializeCoreDynamics(p.core_dynamics),
    ``,
    `### 5. 유지 요인`,
    serializeMaintaining(p.maintaining_factors),
    ``,
    `### ${p.theory_section.title}`,
    serializeTheorySection(p.theory_section),
    ``,
    `### 6. 발달적 맥락`,
    serializeDevelopmental(p.developmental),
    ``,
    `### 7. 강점 및 자원`,
    serializeStrengths(p.strengths),
  ].join('\n');
}

function serializePhase3(p: NoteV2Output['phase3']): string {
  return [
    `## Phase 3: 임상 근거`,
    ``,
    `### 8. 내담자 핵심 발언 (최대 5개)`,
    serializeKeyQuotes(p.key_quotes),
    ``,
    `### 9. 금회기 개입 분석`,
    serializeInterventions(p.interventions),
    ``,
    `### 10. 내담자 관찰 소견`,
    serializeObservations(p.observations),
  ].join('\n');
}

function serializePhase4(p: NoteV2Output['phase4']): string {
  return [
    `## Phase 4: 전략 및 슈퍼비전`,
    ``,
    `### 11. 다음 회기 로드맵`,
    serializeRoadmap(p.roadmap),
    ``,
    `### 12. 간이 슈퍼비전`,
    serializeSupervision(p.supervision),
  ].join('\n');
}

/** V2 노트 전체를 텍스트로 직렬화 (전체 복사용) */
export function serializeNoteV2(note: NoteV2Output): string {
  return [
    serializeOverall(note.phase4.overall_comment),
    ``,
    serializePhase1(note.phase1),
    ``,
    serializePhase2(note.phase2),
    ``,
    serializePhase3(note.phase3),
    ``,
    serializePhase4(note.phase4),
  ].join('\n');
}
