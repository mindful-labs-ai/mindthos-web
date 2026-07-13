import { describe, expect, it } from 'vitest';

import type { Speaker, TranscribeSegment } from '../../types';
import {
  getSpeakerCopyName,
  getSpeakerDisplayName,
  getSpeakerInfo,
  getSpeakerLabel,
} from '../getSpeakerInfo';

const segmentOf = (speaker: number): TranscribeSegment => ({
  id: 0,
  start: 0,
  end: 1,
  speaker,
  text: '',
});

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

describe('getSpeakerInfo (아바타 색상·fallback)', () => {
  it('상담사는 빨강, 내담자1은 초록, 내담자2 이상은 파랑 계열', () => {
    expect(getSpeakerInfo(segmentOf(0), speakers)).toEqual({
      name: '상담사',
      label: '상',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    });
    expect(getSpeakerInfo(segmentOf(1), speakers)).toMatchObject({
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    });
    expect(getSpeakerInfo(segmentOf(2), speakers)).toMatchObject({
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    });
  });

  it('customName이 있으면 ID 기반 로테이션 색을 쓴다 (id % 팔레트 길이)', () => {
    const custom: Speaker[] = [
      { id: 1, role: 'client1', customName: '김민지' },
    ];
    expect(getSpeakerInfo(segmentOf(1), custom)).toEqual({
      name: '김민지',
      label: '김',
      bgColor: 'bg-pink-100', // 팔레트 index 1
      textColor: 'text-pink-600',
    });
  });

  it('counselor/client 외 기타 role도 ID 기반 로테이션 색을 쓴다', () => {
    const etc: Speaker[] = [{ id: 3, role: 'custom_guest' }];
    expect(getSpeakerInfo(segmentOf(3), etc)).toMatchObject({
      name: '참석자 C',
      bgColor: 'bg-cyan-100', // 팔레트 index 3
      textColor: 'text-cyan-600',
    });
  });

  it('speakers에 없는 ID는 알 수 없음 fallback을 반환한다', () => {
    expect(getSpeakerInfo(segmentOf(9), speakers)).toEqual({
      name: '알 수 없음',
      label: '?',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
    });
  });
});
