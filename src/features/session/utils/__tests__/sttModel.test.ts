import { describe, expect, it } from 'vitest';

import {
  isAdvancedTranscriptModel,
  isLegacySttModel,
  rendersNonverbalChips,
  supportsDeid,
} from '../sttModel';

describe('sttModel 술어', () => {
  it('isLegacySttModel: gemini-3만 참', () => {
    expect(isLegacySttModel('gemini-3')).toBe(true);
    expect(isLegacySttModel('whisper')).toBe(false);
    expect(isLegacySttModel('basic')).toBe(false);
    expect(isLegacySttModel(null)).toBe(false);
    expect(isLegacySttModel(undefined)).toBe(false);
  });

  it('isAdvancedTranscriptModel: gemini-3·advanced만 고급 축어록', () => {
    expect(isAdvancedTranscriptModel('gemini-3')).toBe(true);
    expect(isAdvancedTranscriptModel('advanced')).toBe(true);
    expect(isAdvancedTranscriptModel('basic')).toBe(false);
    expect(isAdvancedTranscriptModel('whisper')).toBe(false);
    expect(isAdvancedTranscriptModel(null)).toBe(false);
  });

  it('rendersNonverbalChips: gemini-3·advanced·basic만 칩 렌더', () => {
    expect(rendersNonverbalChips('gemini-3')).toBe(true);
    expect(rendersNonverbalChips('advanced')).toBe(true);
    expect(rendersNonverbalChips('basic')).toBe(true);
    expect(rendersNonverbalChips('whisper')).toBe(false);
    expect(rendersNonverbalChips(null)).toBe(false);
    expect(rendersNonverbalChips(undefined)).toBe(false);
  });

  it('supportsDeid: 벤더 STT(basic·advanced)만 비식별화 지원', () => {
    expect(supportsDeid('basic')).toBe(true);
    expect(supportsDeid('advanced')).toBe(true);
    expect(supportsDeid('gemini-3')).toBe(false);
    expect(supportsDeid('whisper')).toBe(false);
    expect(supportsDeid(null)).toBe(false);
  });
});
