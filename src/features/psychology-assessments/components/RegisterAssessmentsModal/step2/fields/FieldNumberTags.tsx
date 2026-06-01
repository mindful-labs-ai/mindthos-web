import { useState, type KeyboardEvent } from 'react';

import { FieldTextInput } from './FieldTextInput';

interface FieldNumberTagsProps {
  /** JSON 배열 문자열(예: ["1","4","7"]) 또는 ''(미입력) */
  value: string;
  onChange: (value: string) => void;
}

/** 저장 문자열 → 태그 배열. 구버전 콤마 문자열도 허용. */
const parseTags = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* JSON이 아니면 콤마 분리로 폴백 */
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const isItemNo = (s: string) => /^[0-9]{1,3}$/.test(s);

/**
 * 결정적문항 등 "문항 번호 목록(배열)" 입력.
 * 번호를 입력하고 Enter/콤마로 칩 추가, 칩 클릭으로 삭제. 값은 JSON 배열 문자열로 보관해
 * applyValues가 그대로 배열(스키마 ^[0-9]{1,3}$ 항목)로 복원한다.
 */
export const FieldNumberTags = ({ value, onChange }: FieldNumberTagsProps) => {
  const [draft, setDraft] = useState('');
  const tags = parseTags(value);

  const commit = (next: string[]) =>
    onChange(next.length ? JSON.stringify(next) : '');

  const addDraft = () => {
    const items = draft
      .split(',')
      .map((s) => s.trim())
      .filter(isItemNo);
    setDraft('');
    if (!items.length) return;
    const merged = [...tags];
    for (const it of items) if (!merged.includes(it)) merged.push(it);
    commit(merged);
  };

  const remove = (t: string) => commit(tags.filter((x) => x !== t));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addDraft();
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-md border border-green-80 bg-green-20 px-2 py-1 text-sm font-medium text-green-80"
            >
              {t}
              <button
                type="button"
                onClick={() => remove(t)}
                className="text-green-80/70 leading-none transition-colors hover:text-green-80"
                aria-label={`${t} 삭제`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <FieldTextInput
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9,]/g, ''))}
        onKeyDown={onKeyDown}
        onBlur={addDraft}
        placeholder="문항 번호를 입력하고 Enter를 눌러 주세요. 예: 1, 4, 7"
        inputMode="numeric"
      />
    </div>
  );
};
