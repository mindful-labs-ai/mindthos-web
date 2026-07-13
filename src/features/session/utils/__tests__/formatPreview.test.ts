import { describe, expect, it } from 'vitest';

import { formatPreviewText } from '../formatPreview';

describe('formatPreviewText', () => {
  it('null·빈 문자열은 null을 반환한다', () => {
    expect(formatPreviewText(null)).toBeNull();
    expect(formatPreviewText(undefined)).toBeNull();
    expect(formatPreviewText('')).toBeNull();
  });

  it('deid 태그는 원본을 노출하지 않고 (비식별)로 치환한다', () => {
    expect(formatPreviewText('⟪deid:d1|정미연⟫ 씨가 왔다.')).toBe(
      '(비식별) 씨가 왔다.'
    );
  });

  it('advanced 비언어 태그는 제거한다 (라벨 맵 없음)', () => {
    expect(formatPreviewText('안녕⟪nv:s1⟫하세요')).toBe('안녕하세요');
  });

  it('legacy 비언어 태그는 (라벨)·(침묵)·(겹침)으로 치환하고 A/E 빈 태그는 제거한다', () => {
    expect(formatPreviewText('{%A%한숨%} 힘들어요')).toBe('(한숨) 힘들어요');
    expect(formatPreviewText('{%S%} 네')).toBe('(침묵) 네');
    expect(formatPreviewText('{%O%} 네')).toBe('(겹침) 네');
    expect(formatPreviewText('{%A%} 네')).toBe('네');
  });

  it('태그 제거로 생긴 연속 공백을 정리한다', () => {
    expect(formatPreviewText('앞 ⟪nv:a1⟫ 뒤')).toBe('앞 뒤');
  });

  it('정제 결과가 빈 문자열이면 null을 반환한다', () => {
    expect(formatPreviewText('⟪nv:a1⟫')).toBeNull();
  });
});
