import { describe, expect, it } from 'vitest';

import type {
  AssessmentItem,
  AssessmentProgress,
} from '../assessmentUploadGateway';
import { ocrInitialReviewCapPercent, ocrReviewPercent } from '../ocrProgress';

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

  it('maps a single pending OCR item around the 45% milestone', () => {
    const pending = ocrReviewPercent([assessment('pending')]);

    expect(pending).toBeGreaterThanOrEqual(42);
    expect(pending).toBeLessThanOrEqual(48);
  });

  it('moves through the ordered OCR stages without reaching 100% early', () => {
    const pending = ocrReviewPercent([assessment('pending')]);
    const processing = ocrReviewPercent([assessment('processing')]);

    expect(processing).toBeGreaterThanOrEqual(67);
    expect(processing).toBeLessThanOrEqual(73);
    expect(processing).toBeGreaterThan(pending);
    expect(processing).toBeLessThan(100);
  });

  it('caps an initial processing jump at the pending milestone', () => {
    const processing = [assessment('processing')];

    expect(ocrInitialReviewCapPercent(processing)).toBeLessThan(
      ocrReviewPercent(processing)
    );
    expect(ocrInitialReviewCapPercent(processing)).toBeGreaterThanOrEqual(42);
    expect(ocrInitialReviewCapPercent(processing)).toBeLessThanOrEqual(48);
  });

  it('shows 100% only when OCR processing has ended', () => {
    expect(ocrReviewPercent([assessment('completed')])).toBe(100);
  });
});
