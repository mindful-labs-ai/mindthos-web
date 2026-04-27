import React from 'react';

import {
  ConflictBlock,
  DevelopmentalBlock,
  InterventionsBlock,
  KeyQuotesBlock,
  MaintainingFactorsBlock,
  ObservationsBlock,
  OverallBlock,
  PresentingIssueBlock,
  RoadmapBlock,
  StrengthsBlock,
  SupervisionBlock,
  TheoryBlock,
  TheorySectionBlock,
  serializeConflict,
  serializeDevelopmental,
  serializeInterventions,
  serializeKeyQuotes,
  serializeMaintaining,
  serializeObservations,
  serializeOverall,
  serializePresentingIssue,
  serializeRoadmap,
  serializeStrengths,
  serializeSupervision,
  serializeTheory,
  serializeTheorySection,
} from './blocks';
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
    <div ref={containerRef} className="space-y-12">
      <PhaseSection
        phase="Overall"
        title="총평"
        copyText={serializeOverall(phase4.overall_comment)}
        editable={editable}
      >
        <OverallBlock value={phase4.overall_comment} editable={editable} />
      </PhaseSection>

      <PhaseSection
        phase="Phase 1"
        title="상담 배경"
        copyText={serializePhase1(phase1)}
        editable={editable}
      >
        <TheoryBlock theory={phase1.theory} editable={editable} />
        <PresentingIssueBlock
          value={phase1.presenting_issue}
          editable={editable}
        />
      </PhaseSection>

      <PhaseSection
        phase="Phase 2"
        title="사례 개념화"
        copyText={serializePhase2(phase2)}
        editable={editable}
      >
        <ConflictBlock
          precipitants={phase2.precipitants}
          coreDynamics={phase2.core_dynamics}
          editable={editable}
        />
        <MaintainingFactorsBlock
          maintaining={phase2.maintaining_factors}
          editable={editable}
        />
        <TheorySectionBlock
          section={phase2.theory_section}
          editable={editable}
        />
        <DevelopmentalBlock value={phase2.developmental} editable={editable} />
        <StrengthsBlock value={phase2.strengths} editable={editable} />
      </PhaseSection>

      <PhaseSection
        phase="Phase 3"
        title="임상 근거"
        copyText={serializePhase3(phase3)}
        editable={editable}
      >
        <KeyQuotesBlock quotes={phase3.key_quotes} editable={editable} />
        <InterventionsBlock
          interventions={phase3.interventions}
          editable={editable}
        />
        <ObservationsBlock
          observations={phase3.observations}
          editable={editable}
        />
      </PhaseSection>

      <PhaseSection
        phase="Phase 4"
        title="전략 및 수퍼비전"
        copyText={serializePhase4(phase4, phase1.safety_assessment)}
        editable={editable}
      >
        <RoadmapBlock
          roadmap={phase4.roadmap}
          safety={phase1.safety_assessment}
          editable={editable}
        />
        <SupervisionBlock
          supervision={phase4.supervision}
          editable={editable}
        />
      </PhaseSection>
    </div>
  );
});

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: string
) {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = /^\d+$/.test(keys[i]) ? Number(keys[i]) : keys[i];
    current = current[key as string] as Record<string, unknown>;
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
    const value = el.textContent?.trim() ?? '';
    setNestedValue(note as unknown as Record<string, unknown>, path, value);
  });
  return note;
}

function serializePhase1(p: NoteV2Output['phase1']): string {
  return [
    `상담 배경`,
    ``,
    serializeTheory(p.theory),
    ``,
    serializePresentingIssue(p.presenting_issue),
  ].join('\n');
}

function serializePhase2(p: NoteV2Output['phase2']): string {
  return [
    `사례 개념화`,
    ``,
    serializeConflict(p.precipitants, p.core_dynamics),
    ``,
    serializeMaintaining(p.maintaining_factors),
    ``,
    serializeTheorySection(p.theory_section),
    ``,
    serializeDevelopmental(p.developmental),
    ``,
    serializeStrengths(p.strengths),
  ].join('\n');
}

function serializePhase3(p: NoteV2Output['phase3']): string {
  return [
    `임상 근거`,
    ``,
    serializeKeyQuotes(p.key_quotes),
    ``,
    serializeInterventions(p.interventions),
    ``,
    serializeObservations(p.observations),
  ].join('\n');
}

function serializePhase4(
  p: NoteV2Output['phase4'],
  safety: NoteV2Output['phase1']['safety_assessment']
): string {
  return [
    `전략 및 수퍼비전`,
    ``,
    serializeRoadmap(p.roadmap, safety),
    ``,
    serializeSupervision(p.supervision),
  ].join('\n');
}

/** V2 노트 전체를 텍스트로 직렬화 (전체 복사용) */
export function serializeNoteV2(note: NoteV2Output): string {
  return [
    serializeOverall(note.phase4.overall_comment),
    serializePhase1(note.phase1),
    serializePhase2(note.phase2),
    serializePhase3(note.phase3),
    serializePhase4(note.phase4, note.phase1.safety_assessment),
  ].join('\n\n');
}
