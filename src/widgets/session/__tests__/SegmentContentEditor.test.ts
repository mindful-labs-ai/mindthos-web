import { describe, expect, it } from 'vitest';

import { buildSegmentHtml, extractFromDom } from '../SegmentContentEditor';

const toDom = (html: string): HTMLElement => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
};

describe('buildSegmentHtml — 태그 → 칩 HTML', () => {
  it('advanced nv 태그를 data 속성이 있는 칩으로 변환한다', () => {
    const dom = toDom(buildSegmentHtml('⟪nv:s1⟫ 네', ['s1:침묵 3초']));
    const chip = dom.querySelector<HTMLElement>('[data-chip="nv"]');
    expect(chip).not.toBeNull();
    expect(chip!.dataset.nvKey).toBe('s1');
    expect(chip!.dataset.tagType).toBe('S');
    expect(chip!.textContent).toBe('침묵 3초');
    expect(chip!.getAttribute('contenteditable')).toBe('false');
  });

  it('레거시 S/O 칩이 뷰와 동일한 유형별 색을 쓴다 (S=회색, O=보라)', () => {
    const silence = toDom(buildSegmentHtml('{%S%}')).querySelector('span');
    const overlap = toDom(buildSegmentHtml('{%O%}')).querySelector('span');
    expect(silence!.className).toContain('chip-silence');
    expect(overlap!.className).toContain('chip-overlap');
  });

  it('텍스트의 HTML 특수문자를 이스케이프해 마크업 주입을 막는다', () => {
    const dom = toDom(buildSegmentHtml('<b>주입</b> & "따옴표"'));
    expect(dom.querySelector('b')).toBeNull();
    expect(dom.textContent).toBe('<b>주입</b> & "따옴표"');
  });

  it('deid: showDeid ON은 라벨 칩, OFF는 인라인 원본 스팬을 만든다', () => {
    const deid = { d1: '인물1' };
    const on = toDom(
      buildSegmentHtml('⟪deid:d1|정미연⟫', undefined, deid, true)
    );
    const onChip = on.querySelector<HTMLElement>('[data-chip="deid"]');
    expect(onChip!.textContent).toBe('인물1');
    expect(onChip!.dataset.deidOriginal).toBe('정미연');

    const off = toDom(
      buildSegmentHtml('⟪deid:d1|정미연⟫', undefined, deid, false)
    );
    const inline = off.querySelector<HTMLElement>('[data-deid-inline]');
    expect(inline!.textContent).toBe('정미연');
  });
});

describe('buildSegmentHtml ↔ extractFromDom 왕복', () => {
  it('advanced nv + deid(ON) 텍스트가 손실 없이 복원된다', () => {
    const text = '⟪nv:s1⟫ ⟪deid:d1|정미연⟫ 씨가 왔다.';
    const nv = ['s1:침묵 3초'];
    const deid = { d1: '인물1' };
    const dom = toDom(buildSegmentHtml(text, nv, deid, true));

    const result = extractFromDom(dom, nv, deid, true);
    expect(result.text).toBe(text);
    // 변경이 없으므로 nv 업데이트는 발생하지 않아야 한다
    expect(result.nv).toBeUndefined();
  });

  it('레거시 태그({%S%}, {%A%한숨%})가 원형 그대로 복원된다', () => {
    const text = '{%S%} 네 {%A%한숨%} 그래요';
    const dom = toDom(buildSegmentHtml(text));
    expect(extractFromDom(dom).text).toBe(text);
  });

  it('deid(OFF) 인라인 원본을 수정하면 태그의 원본이 갱신된다', () => {
    const deid = { d1: '인물1' };
    const dom = toDom(
      buildSegmentHtml('⟪deid:d1|정미연⟫ 씨', undefined, deid, false)
    );
    dom.querySelector<HTMLElement>('[data-deid-inline]')!.textContent =
      '박영희';

    const result = extractFromDom(dom, undefined, deid, false);
    expect(result.text).toBe('⟪deid:d1|박영희⟫ 씨');
  });

  it('nv 칩을 DOM에서 제거하면 텍스트와 nv 배열에서 함께 빠진다', () => {
    const nv = ['s1:침묵 3초', 'a1:한숨'];
    const dom = toDom(buildSegmentHtml('⟪nv:s1⟫가⟪nv:a1⟫나', nv));
    dom.querySelector('[data-nv-key="s1"]')!.remove();

    const result = extractFromDom(dom, nv);
    expect(result.text).toBe('가⟪nv:a1⟫나');
    expect(result.nv).toEqual(['a1:한숨']);
  });

  it('nv 칩 라벨을 수정하면 nv 배열 항목이 새 라벨로 갱신된다', () => {
    const nv = ['a1:한숨'];
    const dom = toDom(buildSegmentHtml('⟪nv:a1⟫', nv));
    dom.querySelector<HTMLElement>('[data-nv-key="a1"]')!.textContent =
      '깊은 한숨';

    const result = extractFromDom(dom, nv);
    expect(result.nv).toEqual(['a1:깊은 한숨']);
    expect(result.text).toBe('⟪nv:a1⟫');
  });

  it('줄바꿈(<br>)은 \\n으로 복원된다', () => {
    const dom = toDom('첫 줄<br>둘째 줄');
    expect(extractFromDom(dom).text).toBe('첫 줄\n둘째 줄');
  });
});
