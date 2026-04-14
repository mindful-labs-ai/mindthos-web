import { describe, expect, it } from 'vitest';

import { formatSegmentText } from '../formatSegmentText';

describe('formatSegmentText', () => {
  it('태그가 없는 평문은 그대로 반환한다', () => {
    expect(formatSegmentText({ text: '저는 괜찮아요.' })).toBe('저는 괜찮아요.');
  });

  it('빈 텍스트를 안전하게 처리한다', () => {
    expect(formatSegmentText({ text: '' })).toBe('');
  });

  it('undefined text 도 안전하게 처리한다', () => {
    expect(formatSegmentText({ text: undefined as unknown as string })).toBe('');
  });

  describe('비식별화', () => {
    it('deid 태그를 원본으로 복원한다', () => {
      expect(
        formatSegmentText({
          text: '⟪deid:d1|정미연⟫ 씨가 ⟪deid:d2|40만 원⟫을 보냈어요.',
        })
      ).toBe('정미연 씨가 40만 원을 보냈어요.');
    });

    it('원본에 특수문자가 있어도 복원된다', () => {
      expect(
        formatSegmentText({
          text: '⟪deid:d1|홍길동 (33)⟫ 씨요.',
        })
      ).toBe('홍길동 (33) 씨요.');
    });
  });

  describe('advanced 비언어 (⟪nv:key⟫ + nv[])', () => {
    it('nv 배열 라벨로 감싼다', () => {
      expect(
        formatSegmentText({
          text: '⟪nv:a1⟫ 저는 그냥 답답해요.',
          nv: ['a1:한숨'],
        })
      ).toBe('(한숨) 저는 그냥 답답해요.');
    });

    it('여러 nv 태그를 모두 치환한다', () => {
      expect(
        formatSegmentText({
          text: '⟪nv:a1⟫ 저는 ⟪nv:e1⟫ 답답해요.',
          nv: ['a1:한숨', 'e1:슬픔'],
        })
      ).toBe('(한숨) 저는 (슬픔) 답답해요.');
    });

    it('dangling key (nv 배열에 없는 키) 는 조용히 제거한다', () => {
      expect(
        formatSegmentText({
          text: '⟪nv:a99⟫ 저는 답답해요.',
          nv: ['a1:한숨'],
        })
      ).toBe('저는 답답해요.');
    });

    it('nv 배열 자체가 없으면 advanced 태그는 제거된다', () => {
      expect(
        formatSegmentText({
          text: '⟪nv:a1⟫ 저는 답답해요.',
        })
      ).toBe('저는 답답해요.');
    });
  });

  describe('legacy 비언어 ({%X%...%})', () => {
    it('A 태그 내용을 괄호로 감싼다', () => {
      expect(formatSegmentText({ text: '{%A%한숨%} 저는 괜찮아요.' })).toBe(
        '(한숨) 저는 괜찮아요.'
      );
    });

    it('E 태그 내용을 괄호로 감싼다', () => {
      expect(formatSegmentText({ text: '{%E%슬픔%} 그래요.' })).toBe(
        '(슬픔) 그래요.'
      );
    });

    it('S 태그는 (침묵) 으로 치환한다', () => {
      expect(formatSegmentText({ text: '그러니까요. {%S%} 음...' })).toBe(
        '그러니까요. (침묵) 음...'
      );
    });

    it('O 태그는 (겹침) 으로 치환한다', () => {
      expect(formatSegmentText({ text: '{%O%} 네 맞아요.' })).toBe(
        '(겹침) 네 맞아요.'
      );
    });

    it('내용 없는 A/E 는 제거한다', () => {
      expect(formatSegmentText({ text: '{%A%} 그래요.' })).toBe('그래요.');
    });
  });

  describe('혼합 케이스', () => {
    it('비언어 + 비식별화를 한 번에 처리한다', () => {
      expect(
        formatSegmentText({
          text: '⟪nv:a1⟫ ⟪deid:d1|정미연⟫ 씨가 {%S%} ⟪deid:d2|40만 원⟫을 보냈어요.',
          nv: ['a1:한숨'],
        })
      ).toBe('(한숨) 정미연 씨가 (침묵) 40만 원을 보냈어요.');
    });

    it('연속 공백을 1개로 정리한다', () => {
      expect(
        formatSegmentText({
          text: '저는   ⟪nv:a1⟫    답답해요.',
          nv: ['a1:한숨'],
        })
      ).toBe('저는 (한숨) 답답해요.');
    });

    it('앞뒤 공백을 트림한다', () => {
      expect(
        formatSegmentText({
          text: '  {%S%} 저는 괜찮아요.  ',
        })
      ).toBe('(침묵) 저는 괜찮아요.');
    });
  });
});
