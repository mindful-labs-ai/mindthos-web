import { useState } from 'react';

import { FieldChipGroup } from './FieldChipGroup';
import { FieldTextInput } from './FieldTextInput';

interface FieldScoreWithDirectionProps {
  /** "65"(평형=정수) 또는 "65T"/"65F"(방향성 접미사) 또는 ''(미입력) */
  value: string;
  onChange: (value: string) => void;
}

const DIRECTIONS = [
  { value: '평형', label: '평형' },
  { value: 'T', label: 'T쪽' },
  { value: 'F', label: 'F쪽' },
];

const parse = (value: string): { num: string; dir: string } => {
  const m = value.trim().match(/^(\d+)\s*([TFtf])?$/);
  if (!m) return { num: '', dir: '평형' };
  return { num: m[1], dir: m[2] ? m[2].toUpperCase() : '평형' };
};

/**
 * TRIN T점수처럼 "평형 시 정수, 그 외 방향성 접미사(T/F)가 붙는" union 입력.
 * 점수 칸 + 방향 칩. 평형이면 숫자만, T/F면 접미사를 붙여 문자열로 emit한다.
 * (applyValues: 숫자만 → Number, 접미사 → 문자열 유지 — 스키마 oneOf 양쪽 충족)
 */
export const FieldScoreWithDirection = ({
  value,
  onChange,
}: FieldScoreWithDirectionProps) => {
  const parsed = parse(value);
  const num = parsed.num;
  // 방향은 로컬 상태로 둬, 숫자 입력 전에도 버튼을 선택·유지할 수 있게 한다.
  // (숫자가 비면 값은 미입력 ''로 emit하되 선택한 방향은 화면에 남는다)
  const [dir, setDir] = useState(parsed.dir);

  const emit = (nextNum: string, nextDir: string) => {
    const n = nextNum.trim();
    onChange(!n ? '' : nextDir === '평형' ? n : n + nextDir);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FieldTextInput
        value={num}
        onChange={(e) => emit(e.target.value.replace(/[^0-9]/g, ''), dir)}
        placeholder="T점수"
        inputMode="numeric"
        style={{ maxWidth: 81, width: '100%' }}
      />
      <FieldChipGroup
        options={DIRECTIONS}
        value={dir}
        onChange={(d) => {
          setDir(d);
          emit(num, d);
        }}
      />
    </div>
  );
};
