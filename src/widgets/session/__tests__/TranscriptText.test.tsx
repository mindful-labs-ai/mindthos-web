import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { parseNvTagText } from '@/features/session/utils/parseNonverbalText';

import { TranscriptText } from '../TranscriptText';

describe('TranscriptText — 비언어 칩 렌더링', () => {
  it('sttModel이 basic/advanced/gemini-3 아닌 경우 평문으로 렌더한다', () => {
    const parts = parseNvTagText('안녕⟪nv:s1⟫하세요', ['s1:침묵 3초']);
    const { container } = render(
      <TranscriptText parts={parts} sttModel={null} />
    );
    expect(container.querySelector('span')).toBeNull();
    expect(container.textContent).toContain('안녕');
    expect(container.textContent).toContain('하세요');
  });

  it('basic: 침묵(S) → 회색 칩으로 렌더된다', () => {
    const parts = parseNvTagText('⟪nv:s1⟫', ['s1:침묵 3초']);
    const { container } = render(
      <TranscriptText parts={parts} sttModel="basic" />
    );
    const chip = container.querySelector('span');
    expect(chip).not.toBeNull();
    expect(chip!.textContent).toBe('침묵 3초');
    expect(chip!.className).toMatch(/bg-gray/);
  });

  it('basic: 감정(E) → 주황 칩으로 렌더된다', () => {
    const parts = parseNvTagText('⟪nv:e1⟫', ['e1:웃음']);
    const { container } = render(
      <TranscriptText parts={parts} sttModel="basic" />
    );
    const chip = container.querySelector('span');
    expect(chip).not.toBeNull();
    expect(chip!.textContent).toBe('웃음');
    expect(chip!.className).toMatch(/bg-amber/);
  });

  it('basic: 액션(A) → 파란 칩으로 렌더된다', () => {
    const parts = parseNvTagText('⟪nv:a1⟫', ['a1:박수']);
    const { container } = render(
      <TranscriptText parts={parts} sttModel="basic" />
    );
    const chip = container.querySelector('span');
    expect(chip).not.toBeNull();
    expect(chip!.textContent).toBe('박수');
    expect(chip!.className).toMatch(/bg-blue/);
  });

  it('advanced도 칩으로 렌더된다', () => {
    const parts = parseNvTagText('⟪nv:s1⟫', ['s1:침묵 5초']);
    const { container } = render(
      <TranscriptText parts={parts} sttModel="advanced" />
    );
    expect(container.querySelector('span')).not.toBeNull();
  });
});

describe('TranscriptText — deid 라벨 렌더링', () => {
  it('deid를 전달하면 텍스트 내 ⟪deid:⟫ 태그를 라벨 스팬으로 렌더한다', () => {
    const parts = parseNvTagText('⟪deid:d1|정미연⟫ 씨가 왔다.', undefined);
    const { container } = render(
      <TranscriptText
        parts={parts}
        sttModel="advanced"
        deid={{ d1: '인물1' }}
      />
    );
    const label = container.querySelector('span');
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe('인물1');
    expect(container.textContent).toBe('인물1 씨가 왔다.');
  });

  it('deid 미전달 시 태그가 원문 그대로 노출된다', () => {
    const parts = parseNvTagText('⟪deid:d1|정미연⟫ 씨', undefined);
    const { container } = render(
      <TranscriptText parts={parts} sttModel="advanced" />
    );
    expect(container.textContent).toBe('⟪deid:d1|정미연⟫ 씨');
  });
});
