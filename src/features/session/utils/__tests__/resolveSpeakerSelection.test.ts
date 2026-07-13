import { describe, expect, it } from 'vitest';

import type { Speaker } from '../../types';
import { resolveSpeakerSelection } from '../getSpeakerInfo';

const speakers: Speaker[] = [
  { id: 0, role: 'counselor' },
  { id: 1, role: 'client1' },
  { id: 2, role: 'custom_2', customName: '김철수' },
];

describe('resolveSpeakerSelection', () => {
  it('기존 speaker id는 그대로 재사용', () => {
    const r = resolveSpeakerSelection(speakers, { kind: 'existing', id: 1 });
    expect(r.speakerId).toBe(1);
    expect(r.speakers).toBe(speakers); // 변경 없음
  });

  it('customName 일치 시 기존 재사용', () => {
    const r = resolveSpeakerSelection(speakers, {
      kind: 'name',
      name: '김철수',
    });
    expect(r.speakerId).toBe(2);
    expect(r.speakers).toHaveLength(3);
  });

  it('표시이름(상담사) 일치 시 기존 재사용', () => {
    const r = resolveSpeakerSelection(speakers, {
      kind: 'name',
      name: '상담사',
    });
    expect(r.speakerId).toBe(0);
  });

  it('새 이름은 maxId+1로 생성', () => {
    const r = resolveSpeakerSelection(speakers, {
      kind: 'name',
      name: '이영희',
    });
    expect(r.speakerId).toBe(3);
    expect(r.speakers).toHaveLength(4);
    expect(r.speakers[3]).toEqual({
      id: 3,
      role: 'custom_3',
      customName: '이영희',
    });
  });
});
