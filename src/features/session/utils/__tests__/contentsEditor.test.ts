import { describe, expect, it } from 'vitest';

import type { TranscribeContents, TranscriptJson } from '../../types';
import {
  addSegmentAfter,
  applyBulkDeidEdits,
  applyBulkNvEdits,
  applyBulkSpeakerChanges,
  applyBulkTextEdits,
  generateSpeakersFromSegments,
  getSegments,
  getSpeakers,
  removeSegment,
  updateSegmentSpeaker,
  updateSegmentText,
} from '../contentsEditor';

const transcriptJson: TranscriptJson = {
  language: 'ko',
  segments: [
    { id: 0, start: 0, end: 1, speaker: 0, text: '첫 발화' },
    { id: 1, start: 1, end: 2, speaker: 1, text: '두 번째 발화' },
  ],
  text: '',
  raw_output: '',
  stt_model: 'advanced',
};

const legacyContents: TranscribeContents = {
  audio_uuid: 'a1',
  status: 'completed',
  result: {
    segments: [{ id: 0, start: 0, end: 1, speaker: 0, text: '레거시 발화' }],
    speakers: [{ id: 0, role: 'counselor' }],
  },
};

describe('getSegments / getSpeakers — 듀얼 포맷', () => {
  it('TranscriptJson 구조에서 세그먼트를 추출한다', () => {
    expect(getSegments(transcriptJson)).toHaveLength(2);
  });

  it('레거시(result) 구조에서 세그먼트·화자를 추출한다', () => {
    expect(getSegments(legacyContents)).toHaveLength(1);
    expect(getSpeakers(legacyContents)).toEqual([{ id: 0, role: 'counselor' }]);
  });

  it('speakers가 없으면 세그먼트에서 자동 생성한다', () => {
    expect(getSpeakers(transcriptJson)).toEqual([
      { id: 0, role: 'counselor' },
      { id: 1, role: 'client1' },
    ]);
  });
});

describe('generateSpeakersFromSegments', () => {
  it('화자 ID를 정렬해 0→상담사, 1→내담자1, N→내담자N 역할을 부여한다', () => {
    const speakers = generateSpeakersFromSegments([
      { id: 0, start: 0, end: 1, speaker: 2, text: '' },
      { id: 1, start: 1, end: 2, speaker: 0, text: '' },
      { id: 2, start: 2, end: 3, speaker: 1, text: '' },
    ]);
    expect(speakers).toEqual([
      { id: 0, role: 'counselor' },
      { id: 1, role: 'client1' },
      { id: 2, role: 'client2' },
    ]);
  });
});

describe('세그먼트 편집 — 듀얼 포맷 불변 업데이트', () => {
  it('updateSegmentText: 대상 세그먼트만 수정하고 원본은 유지한다', () => {
    const updated = updateSegmentText(transcriptJson, 1, '수정됨');
    expect(getSegments(updated)[1].text).toBe('수정됨');
    expect(getSegments(transcriptJson)[1].text).toBe('두 번째 발화');
  });

  it('updateSegmentSpeaker: 대상 세그먼트의 화자를 바꾼다', () => {
    const updated = updateSegmentSpeaker(transcriptJson, 0, 3);
    expect(getSegments(updated)[0].speaker).toBe(3);
  });

  it('레거시 구조에서도 텍스트 수정이 동작한다', () => {
    const updated = updateSegmentText(legacyContents, 0, '레거시 수정');
    expect(getSegments(updated)[0].text).toBe('레거시 수정');
  });

  it('addSegmentAfter: 지정 세그먼트 뒤에 삽입한다', () => {
    const updated = addSegmentAfter(transcriptJson, 0, {
      id: 99,
      start: 0.5,
      end: 0.9,
      speaker: 0,
      text: '삽입',
    });
    expect(getSegments(updated).map((s) => s.id)).toEqual([0, 99, 1]);
  });

  it('addSegmentAfter: 대상 ID가 없으면 변경하지 않는다', () => {
    const updated = addSegmentAfter(transcriptJson, 123, {
      id: 99,
      start: 0,
      end: 1,
      speaker: 0,
      text: '',
    });
    expect(getSegments(updated)).toHaveLength(2);
  });

  it('removeSegment: 대상 세그먼트를 삭제한다', () => {
    expect(
      getSegments(removeSegment(transcriptJson, 0)).map((s) => s.id)
    ).toEqual([1]);
  });
});

describe('일괄 편집', () => {
  it('applyBulkTextEdits: 여러 세그먼트 텍스트를 한 번에 수정한다', () => {
    const updated = applyBulkTextEdits(transcriptJson, {
      0: '일괄1',
      1: '일괄2',
    });
    expect(getSegments(updated).map((s) => s.text)).toEqual(['일괄1', '일괄2']);
  });

  it('applyBulkTextEdits: 빈 edits면 원본 참조를 그대로 반환한다', () => {
    expect(applyBulkTextEdits(transcriptJson, {})).toBe(transcriptJson);
  });

  it('applyBulkSpeakerChanges: 화자 변경과 화자 정의를 함께 반영한다', () => {
    const speakers = [
      { id: 0, role: 'counselor' },
      { id: 1, role: 'client1', customName: '민지' },
    ];
    const updated = applyBulkSpeakerChanges(transcriptJson, { 0: 1 }, speakers);
    expect(getSegments(updated)[0].speaker).toBe(1);
    expect(getSpeakers(updated)[1].customName).toBe('민지');
  });

  it('applyBulkNvEdits / applyBulkDeidEdits: 대상 세그먼트에만 반영한다', () => {
    const withNv = applyBulkNvEdits(transcriptJson, { 0: ['a1:한숨'] });
    expect(getSegments(withNv)[0].nv).toEqual(['a1:한숨']);
    expect(getSegments(withNv)[1].nv).toBeUndefined();

    const withDeid = applyBulkDeidEdits(transcriptJson, {
      1: { d1: '인물1' },
    });
    expect(getSegments(withDeid)[1].deid).toEqual({ d1: '인물1' });
  });
});
