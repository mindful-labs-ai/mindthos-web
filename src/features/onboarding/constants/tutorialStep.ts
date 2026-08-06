import type { CohortBranch } from './cohort';

/**
 * mindthos-server와 동일한 Tutorial API 단계 계약.
 * cohort와 current_stage를 화면에서 별도 상태로 조합하지 않는다.
 */
export const TutorialStep = {
  GENOGRAM_STAGE_1: 'GENOGRAM_STAGE_1',
  GENOGRAM_STAGE_2: 'GENOGRAM_STAGE_2',
  GENOGRAM_STAGE_3: 'GENOGRAM_STAGE_3',
  GENOGRAM_STAGE_4: 'GENOGRAM_STAGE_4',
  CBT_STAGE_1: 'CBT_STAGE_1',
  CBT_STAGE_2: 'CBT_STAGE_2',
  CBT_STAGE_3: 'CBT_STAGE_3',
  CBT_STAGE_4: 'CBT_STAGE_4',
  PSYCHODYNAMIC_STAGE_1: 'PSYCHODYNAMIC_STAGE_1',
  PSYCHODYNAMIC_STAGE_2: 'PSYCHODYNAMIC_STAGE_2',
  PSYCHODYNAMIC_STAGE_3: 'PSYCHODYNAMIC_STAGE_3',
  PSYCHODYNAMIC_STAGE_4: 'PSYCHODYNAMIC_STAGE_4',
  HUMANISTIC_STAGE_1: 'HUMANISTIC_STAGE_1',
  HUMANISTIC_STAGE_2: 'HUMANISTIC_STAGE_2',
  HUMANISTIC_STAGE_3: 'HUMANISTIC_STAGE_3',
  HUMANISTIC_STAGE_4: 'HUMANISTIC_STAGE_4',
  GENERIC_STAGE_1: 'GENERIC_STAGE_1',
  GENERIC_STAGE_2: 'GENERIC_STAGE_2',
  GENERIC_STAGE_3: 'GENERIC_STAGE_3',
  GENERIC_STAGE_4: 'GENERIC_STAGE_4',
} as const;

export type TutorialStep = (typeof TutorialStep)[keyof typeof TutorialStep];

const TUTORIAL_STEPS_BY_COHORT: Record<
  CohortBranch,
  readonly [TutorialStep, TutorialStep, TutorialStep, TutorialStep]
> = {
  GENOGRAM: [
    TutorialStep.GENOGRAM_STAGE_1,
    TutorialStep.GENOGRAM_STAGE_2,
    TutorialStep.GENOGRAM_STAGE_3,
    TutorialStep.GENOGRAM_STAGE_4,
  ],
  CBT: [
    TutorialStep.CBT_STAGE_1,
    TutorialStep.CBT_STAGE_2,
    TutorialStep.CBT_STAGE_3,
    TutorialStep.CBT_STAGE_4,
  ],
  PSYCHODYNAMIC: [
    TutorialStep.PSYCHODYNAMIC_STAGE_1,
    TutorialStep.PSYCHODYNAMIC_STAGE_2,
    TutorialStep.PSYCHODYNAMIC_STAGE_3,
    TutorialStep.PSYCHODYNAMIC_STAGE_4,
  ],
  HUMANISTIC: [
    TutorialStep.HUMANISTIC_STAGE_1,
    TutorialStep.HUMANISTIC_STAGE_2,
    TutorialStep.HUMANISTIC_STAGE_3,
    TutorialStep.HUMANISTIC_STAGE_4,
  ],
  GENERIC: [
    TutorialStep.GENERIC_STAGE_1,
    TutorialStep.GENERIC_STAGE_2,
    TutorialStep.GENERIC_STAGE_3,
    TutorialStep.GENERIC_STAGE_4,
  ],
};

export function getTutorialStep(
  cohort: CohortBranch | null,
  stage: number | null | undefined
): TutorialStep | null {
  if (!cohort || !stage || stage < 1 || stage > 4) return null;
  return TUTORIAL_STEPS_BY_COHORT[cohort][stage - 1] ?? null;
}

export function getTutorialStage(
  cohort: CohortBranch,
  tutorialStep: TutorialStep
): number | null {
  const stage = TUTORIAL_STEPS_BY_COHORT[cohort].indexOf(tutorialStep);
  return stage === -1 ? null : stage + 1;
}

/** 서버가 내려준 TutorialStep에서 cohort를 역산한다. */
export function getCohortFromTutorialStep(
  tutorialStep: TutorialStep | null | undefined
): CohortBranch | null {
  if (!tutorialStep) return null;

  return (
    (Object.entries(TUTORIAL_STEPS_BY_COHORT).find(([, steps]) =>
      steps.includes(tutorialStep)
    )?.[0] as CohortBranch | undefined) ?? null
  );
}
