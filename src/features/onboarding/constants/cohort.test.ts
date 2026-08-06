import { describe, expect, it } from 'vitest';

import { COHORT_BRANCH, resolveCohortBranch } from './cohort';

describe('landing cohort parameter', () => {
  it.each([
    ['GENOGRAM', COHORT_BRANCH.GENOGRAM],
    ['CBT', COHORT_BRANCH.CBT],
    ['PSYCHODYNAMIC', COHORT_BRANCH.PSYCHODYNAMIC],
    ['HUMANISTIC', COHORT_BRANCH.HUMANISTIC],
    ['GENERIC', COHORT_BRANCH.GENERIC],
  ])('resolves cohort=%s to %s', (cohort, expected) => {
    expect(resolveCohortBranch(`?cohort=${cohort}`)).toBe(expected);
  });

  it('does not resolve lowercase values when the contract requires uppercase', () => {
    expect(resolveCohortBranch('?cohort=genogram')).toBeNull();
  });

  it('does not resolve an unknown value to an arbitrary cohort', () => {
    expect(resolveCohortBranch('?cohort=unknown')).toBeNull();
  });

  it('ignores unrelated parameters', () => {
    expect(
      resolveCohortBranch('?utm_campaign=legacy-campaign&ref=ignored')
    ).toBeNull();
  });
});
