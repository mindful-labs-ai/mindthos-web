import { describe, expect, it } from 'vitest';

import { COHORT_BRANCH } from './cohort';
import {
  getCohortFromTutorialStep,
  getTutorialStage,
  getTutorialStep,
  TutorialStep,
} from './tutorialStep';

describe('TutorialStep contract', () => {
  it('5개 cohort마다 4개의 고유한 TutorialStep을 제공한다', () => {
    const steps = Object.values(COHORT_BRANCH).flatMap((cohort) =>
      [1, 2, 3, 4].map((stage) => getTutorialStep(cohort, stage))
    );

    expect(steps).toHaveLength(20);
    expect(new Set(steps).size).toBe(20);
    expect(steps).not.toContain(null);
  });

  it('서버와 동일한 enum 값으로 단계와 TutorialStep을 왕복한다', () => {
    expect(getTutorialStep(COHORT_BRANCH.CBT, 2)).toBe(
      TutorialStep.CBT_STAGE_2
    );
    expect(getTutorialStage(COHORT_BRANCH.CBT, TutorialStep.CBT_STAGE_2)).toBe(
      2
    );
    expect(
      getTutorialStage(COHORT_BRANCH.CBT, TutorialStep.GENOGRAM_STAGE_2)
    ).toBeNull();
  });

  it('서버 TutorialStep에서 cohort를 역산한다', () => {
    expect(getCohortFromTutorialStep(TutorialStep.GENOGRAM_STAGE_3)).toBe(
      COHORT_BRANCH.GENOGRAM
    );
    expect(getCohortFromTutorialStep(null)).toBeNull();
  });
});
