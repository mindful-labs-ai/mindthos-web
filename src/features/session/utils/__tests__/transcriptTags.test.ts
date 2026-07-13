import { describe, expect, it } from 'vitest';

import {
  buildAdvancedNvTag,
  buildDeidTag,
  buildLegacyNvTag,
  createAdvancedNvRegex,
  createDeidRegex,
  createLegacyNvRegex,
  NONVERBAL_DEFAULT_LABELS,
  nvKeyToTagType,
  parseNvEntries,
} from '../transcriptTags';

describe('createLegacyNvRegex', () => {
  it('내용 있는 태그({%A%한숨%})에서 유형과 라벨을 캡처한다', () => {
    const match = createLegacyNvRegex().exec('{%A%한숨%}');
    expect(match?.[1]).toBe('A');
    expect(match?.[2]).toBe('한숨');
  });

  it('내용 없는 태그({%S%})는 라벨 캡처가 undefined', () => {
    const match = createLegacyNvRegex().exec('{%S%}');
    expect(match?.[1]).toBe('S');
    expect(match?.[2]).toBeUndefined();
  });

  it('SAEO 외 유형({%X%})은 매칭하지 않는다', () => {
    expect(createLegacyNvRegex().test('{%X%내용%}')).toBe(false);
  });

  it('호출마다 새 인스턴스를 반환한다 (lastIndex 상태 미공유)', () => {
    const a = createLegacyNvRegex();
    const b = createLegacyNvRegex();
    expect(a).not.toBe(b);
    a.exec('{%S%}');
    expect(a.lastIndex).toBeGreaterThan(0);
    expect(b.lastIndex).toBe(0);
  });
});

describe('createAdvancedNvRegex', () => {
  it('⟪nv:KEY⟫에서 KEY를 캡처한다', () => {
    const match = createAdvancedNvRegex().exec('안녕⟪nv:a1⟫하세요');
    expect(match?.[1]).toBe('a1');
  });
});

describe('createDeidRegex', () => {
  it('⟪deid:KEY|원본⟫에서 KEY와 원본을 캡처한다', () => {
    const match = createDeidRegex().exec('⟪deid:d1|정미연⟫ 씨');
    expect(match?.[1]).toBe('d1');
    expect(match?.[2]).toBe('정미연');
  });

  it('원본에 공백·특수문자가 있어도 캡처한다', () => {
    const match = createDeidRegex().exec('⟪deid:d2|40만 원 (송금)⟫');
    expect(match?.[2]).toBe('40만 원 (송금)');
  });
});

describe('nvKeyToTagType', () => {
  it('e 접두는 감정(E), s 접두는 침묵(S), 그 외는 액션(A)', () => {
    expect(nvKeyToTagType('e1')).toBe('E');
    expect(nvKeyToTagType('s3')).toBe('S');
    expect(nvKeyToTagType('a1')).toBe('A');
    expect(nvKeyToTagType('x9')).toBe('A');
  });
});

describe('parseNvEntries', () => {
  it('["KEY:라벨"] 배열을 KEY→{tagType, label} 맵으로 변환한다', () => {
    const map = parseNvEntries(['s1:침묵 3초', 'e1:웃음', 'a1:박수']);
    expect(map.get('s1')).toEqual({ tagType: 'S', label: '침묵 3초' });
    expect(map.get('e1')).toEqual({ tagType: 'E', label: '웃음' });
    expect(map.get('a1')).toEqual({ tagType: 'A', label: '박수' });
  });

  it('라벨에 콜론이 포함되면 첫 콜론 이후 전체를 라벨로 본다', () => {
    const map = parseNvEntries(['a1:비율 1:2 언급']);
    expect(map.get('a1')?.label).toBe('비율 1:2 언급');
  });

  it('undefined·빈 배열·잘못된 항목은 빈 맵/무시 처리한다', () => {
    expect(parseNvEntries(undefined).size).toBe(0);
    expect(parseNvEntries([]).size).toBe(0);
    expect(parseNvEntries(['콜론없음', ':라벨만', 'a1:']).size).toBe(0);
  });
});

describe('NONVERBAL_DEFAULT_LABELS', () => {
  it('침묵·겹침만 기본 라벨을 갖고 행동·감정은 빈 문자열이다', () => {
    expect(NONVERBAL_DEFAULT_LABELS.S).toBe('침묵');
    expect(NONVERBAL_DEFAULT_LABELS.O).toBe('겹침');
    expect(NONVERBAL_DEFAULT_LABELS.A).toBe('');
    expect(NONVERBAL_DEFAULT_LABELS.E).toBe('');
  });
});

describe('태그 빌더 — 직렬화와 파싱 왕복', () => {
  it('buildAdvancedNvTag / buildLegacyNvTag / buildDeidTag 형식', () => {
    expect(buildAdvancedNvTag('a1')).toBe('⟪nv:a1⟫');
    expect(buildLegacyNvTag('A', '한숨')).toBe('{%A%한숨%}');
    expect(buildLegacyNvTag('S')).toBe('{%S%}');
    expect(buildDeidTag('d1', '홍길동')).toBe('⟪deid:d1|홍길동⟫');
  });

  it('빌더 출력이 대응 정규식으로 원형 파싱된다 (roundtrip)', () => {
    const legacy = createLegacyNvRegex().exec(buildLegacyNvTag('E', '웃음'));
    expect(legacy?.[1]).toBe('E');
    expect(legacy?.[2]).toBe('웃음');

    const legacyEmpty = createLegacyNvRegex().exec(buildLegacyNvTag('O'));
    expect(legacyEmpty?.[1]).toBe('O');
    expect(legacyEmpty?.[2]).toBeUndefined();

    const adv = createAdvancedNvRegex().exec(buildAdvancedNvTag('s9'));
    expect(adv?.[1]).toBe('s9');

    const deid = createDeidRegex().exec(buildDeidTag('d2', '40만 원 (송금)'));
    expect(deid?.[1]).toBe('d2');
    expect(deid?.[2]).toBe('40만 원 (송금)');
  });
});
