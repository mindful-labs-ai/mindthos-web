import { describe, expect, it } from 'vitest';

import type { AnalysisStatusResponse } from '@/shared/api/server/assessmentUploadApi';

import { calcAnalysisPercent } from '../useAnalysis';

const status = (
  assessmentReports: AnalysisStatusResponse['assessmentReports'],
  integrationReportCompleted = false
): AnalysisStatusResponse => ({
  clientId: 'client-1',
  assessmentVersion: 1,
  chatActiveStatus: integrationReportCompleted
    ? 'CHAT_ACTIVE'
    : 'ANALYSIS_PHASE',
  assessmentReports,
  integrationReportCompleted,
});

describe('calcAnalysisPercent', () => {
  it('starts analysis loading at 10%', () => {
    expect(
      calcAnalysisPercent(
        status([
          { type: 'MMPI_2', completed: false },
          { type: 'TCI', completed: false },
        ])
      )
    ).toBe(10);
  });

  it('uses the remaining 90% for ordered report and integration progress', () => {
    const actual = calcAnalysisPercent(
      status([
        { type: 'MMPI_2', completed: true },
        { type: 'TCI', completed: false },
      ])
    );

    expect(actual).toBeGreaterThanOrEqual(37);
    expect(actual).toBeLessThanOrEqual(43);
  });

  it('shows 100% when integration is complete', () => {
    expect(
      calcAnalysisPercent(
        status(
          [
            { type: 'MMPI_2', completed: true },
            { type: 'TCI', completed: true },
          ],
          true
        )
      )
    ).toBe(100);
  });
});
