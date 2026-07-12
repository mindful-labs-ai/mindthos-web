import { describe, expect, it } from 'vitest';

import type { Speaker } from '../../types';
import {
  getSpeakerCopyName,
  getSpeakerDisplayName,
  getSpeakerLabel,
} from '../getSpeakerInfo';

const speakers: Speaker[] = [
  { id: 0, role: 'counselor' },
  { id: 1, role: 'client1' },
  { id: 2, role: 'client2' },
];

describe('getSpeakerDisplayName (UI 표시명)', () => {
  it('customName이 있으면 우선 사용한다', () => {
    expect(
      getSpeakerDisplayName({ id: 1, role: 'client1', customName: '김민지' })
    ).toBe('김민지');
  });

  it('counselor → 상담사, clientN → 내담자 A/B…', () => {
    expect(getSpeakerDisplayName({ id: 0, role: 'counselor' })).toBe('상담사');
    expect(getSpeakerDisplayName({ id: 1, role: 'client1' })).toBe('내담자 A');
    expect(getSpeakerDisplayName({ id: 2, role: 'client2' })).toBe('내담자 B');
  });

  it('알 수 없는 role은 참석자 + 알파벳 라벨', () => {
    expect(getSpeakerDisplayName({ id: 3, role: 'custom_x' })).toBe('참석자 C');
  });
});

describe('getSpeakerLabel (아바타 라벨)', () => {
  it('customName 첫 글자 / 상 / 알파벳을 반환한다', () => {
    expect(
      getSpeakerLabel({ id: 1, role: 'client1', customName: '김민지' })
    ).toBe('김');
    expect(getSpeakerLabel({ id: 0, role: 'counselor' })).toBe('상');
    expect(getSpeakerLabel({ id: 1, role: 'client1' })).toBe('A');
    expect(getSpeakerLabel({ id: 2, role: 'client2' })).toBe('B');
  });
});

describe('getSpeakerCopyName (복사 출력 전용 — UI 표시명과 규칙이 다름)', () => {
  it('client1 → 내담자, client2 → 내담자2 (UI의 내담자 A/B와 다른 하위 호환 규칙)', () => {
    expect(getSpeakerCopyName(0, speakers)).toBe('상담사');
    expect(getSpeakerCopyName(1, speakers)).toBe('내담자');
    expect(getSpeakerCopyName(2, speakers)).toBe('내담자2');
  });

  it('customName이 있으면 우선 사용한다', () => {
    expect(
      getSpeakerCopyName(1, [{ id: 1, role: 'client1', customName: '김민지' }])
    ).toBe('김민지');
  });

  it('speakers에 없는 ID는 기본 이름으로 대체한다', () => {
    expect(getSpeakerCopyName(0, [])).toBe('상담사');
    expect(getSpeakerCopyName(1, [])).toBe('내담자');
    expect(getSpeakerCopyName(4, [])).toBe('화자 5');
  });

  it('custom_ 접두 role은 기본 이름으로 대체한다', () => {
    expect(getSpeakerCopyName(1, [{ id: 1, role: 'custom_abc' }])).toBe(
      '내담자'
    );
  });
});
