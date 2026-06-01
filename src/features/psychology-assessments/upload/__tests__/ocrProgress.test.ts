import { describe, expect, it } from 'vitest';

import type {
  AssessmentItem,
  AssessmentProgress,
} from '../assessmentUploadGateway';
import { ocrReviewPercent } from '../ocrProgress';

const assessment = (
  progress: AssessmentProgress,
  id = progress
): AssessmentItem => ({
  assessmentId: id,
  kind: 'mmpi',
  title: `${id}.pdf`,
  assessmentVersion: 0,
  progress,
  validation: null,
  score: null,
  tempScore: null,
});

describe('ocrReviewPercent', () => {
  it('shows 10% while waiting for the first OCR status', () => {
    expect(ocrReviewPercent([])).toBe(10);
  });

  it('keeps an initiated OCR batch at the 10% starting point', () => {
    expect(ocrReviewPercent([assessment('initiated')])).toBe(10);
  });

  it('moves through the ordered OCR stages without reaching 100% early', () => {
    const pending = ocrReviewPercent([assessment('pending')]);
    const processing = ocrReviewPercent([assessment('processing')]);

    expect(pending).toBeGreaterThan(10);
    expect(processing).toBeGreaterThan(pending);
    expect(processing).toBeLessThan(100);
  });

  it('shows 100% only when OCR processing has ended', () => {
    expect(ocrReviewPercent([assessment('completed')])).toBe(100);
  });
});
