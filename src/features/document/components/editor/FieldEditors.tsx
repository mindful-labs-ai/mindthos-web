import { useEffect, useRef } from 'react';

import { X } from 'lucide-react';

import { createOption } from '../../constants/formField';
import type {
  ConsentField,
  FormField,
  FormFieldOption,
  LongField,
  MultipleField,
  RichtextField,
  ScoreField,
  SectionField,
  ShortField,
  SingleField,
} from '../../types';

import { RichTextEditor } from './RichTextEditor';
import { ScoreRangeSelect } from './ScoreRangeSelect';

/**
 * 변형별 필드 에디터 — 각 에디터는 narrowed된 구체 변형(field)을 받고,
 * `update(patch: Partial<구체변형>)`로 부분 수정한다. patch가 **구체(비제네릭·비유니온)**
 * Partial이라 잘못된 키는 컴파일 에러(excess 검사 firing) → 변형 정합이 보장된다.
 * onChange는 완성된 FormField를 부모에 넘긴다(부분 패치/캐스팅 없음).
 */

/** 점수 범위 전체 한계 — 1~10 */
const SCORE_LIMIT_MIN = 1;
const SCORE_LIMIT_MAX = 10;

/** from~to 정수 목록 */
function scoreRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

type EditorProps<T extends FormField> = {
  field: T;
  onChange: (updated: FormField) => void;
};

/** 헤더 라벨/제목 입력 — 변형 무관 더미 입력(중복 제거용). */
function HeaderInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="h-[41px] w-full rounded-lg bg-grey-20 px-3 text-l font-emphasize text-grey-100 placeholder:text-grey-80 focus:outline-none"
    />
  );
}

function SectionEditor({ field, onChange }: EditorProps<SectionField>) {
  const update = (patch: Partial<SectionField>) =>
    onChange({ ...field, ...patch });
  return (
    <>
      <HeaderInput
        value={field.title}
        onChange={(title) => update({ title })}
        placeholder="제목"
        ariaLabel="제목 입력"
      />
      <textarea
        value={field.description ?? ''}
        onChange={(e) => update({ description: e.target.value })}
        placeholder="설명"
        aria-label="설명 입력"
        className="mt-5 block h-[100px] w-full resize-none rounded-lg bg-grey-20 px-3 py-[5px] text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
      />
    </>
  );
}

function RichtextEditor({ field, onChange }: EditorProps<RichtextField>) {
  const update = (patch: Partial<RichtextField>) =>
    onChange({ ...field, ...patch });
  return (
    <RichTextEditor
      key={field.key}
      initialHtml={field.html || undefined}
      onContentChange={(html) => update({ html })}
    />
  );
}

function TextEditor({ field, onChange }: EditorProps<ShortField | LongField>) {
  const update = (patch: Partial<ShortField | LongField>) =>
    onChange({ ...field, ...patch });
  return (
    <>
      <HeaderInput
        value={field.label}
        onChange={(label) => update({ label })}
        placeholder="질문"
        ariaLabel="항목 입력"
      />
      {field.type === 'short' ? (
        <div className="mt-5 flex h-[34px] items-center rounded-lg bg-grey-20 px-3 text-m font-medium text-grey-80">
          답변
        </div>
      ) : (
        <div className="mt-5 h-[100px] rounded-lg bg-grey-20 px-3 py-[5px] text-m font-medium text-grey-80">
          답변
        </div>
      )}
    </>
  );
}

function ChoiceEditor({
  field,
  onChange,
}: EditorProps<SingleField | MultipleField>) {
  // 옵션 input Tab 이동/추가용 — 새로 만든 옵션은 렌더 후 포커스
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex.current !== null) {
      optionInputRefs.current[pendingFocusIndex.current]?.focus();
      pendingFocusIndex.current = null;
    }
  });

  const update = (patch: Partial<SingleField | MultipleField>) =>
    onChange({ ...field, ...patch });
  const options = field.options;

  const patchOptions = (next: FormFieldOption[]) => update({ options: next });
  const handleOptionLabelChange = (index: number, label: string) =>
    patchOptions(options.map((o, i) => (i === index ? { ...o, label } : o)));
  const handleRemoveOption = (index: number) =>
    patchOptions(options.filter((_, i) => i !== index));
  const handleAddOption = () => patchOptions([...options, createOption()]);

  // Tab: 다음 옵션으로 이동, 마지막이면 새 옵션 추가 후 이동.
  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    // 한글 등 IME 조합 중엔 무시 — 조합이 현재 옵션에 확정된 뒤 실제 Tab에서 처리.
    // (안 막으면 조합 중 Tab이 조기 발화해 옵션이 두 개 생기고 마지막 글자가 누수됨.)
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    if (index < options.length - 1) {
      optionInputRefs.current[index + 1]?.focus();
    } else {
      pendingFocusIndex.current = index + 1;
      handleAddOption();
    }
  };

  // 옵션 마커 — 단일 선택은 원형, 다중 선택은 사각(체크박스)
  const markerClass = `h-6 w-6 flex-shrink-0 border-2 border-grey-40 ${
    field.type === 'multiple' ? 'rounded-[4px]' : 'rounded-full'
  }`;

  return (
    <>
      <HeaderInput
        value={field.label}
        onChange={(label) => update({ label })}
        placeholder="질문"
        ariaLabel="항목 입력"
      />
      <div className="mt-5 flex flex-col gap-3">
        {options.map((option, i) => (
          <div key={option.value} className="flex items-center gap-3">
            <span className={markerClass} />
            <input
              ref={(el) => {
                optionInputRefs.current[i] = el;
              }}
              type="text"
              value={option.label}
              onChange={(e) => handleOptionLabelChange(i, e.target.value)}
              onKeyDown={(e) => handleOptionKeyDown(e, i)}
              placeholder={`옵션 ${i + 1}`}
              aria-label={`옵션 ${i + 1}`}
              className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-3 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
            />
            {/* 첫 옵션은 삭제 불가 — X 자리 비움 */}
            {i > 0 ? (
              <button
                type="button"
                aria-label={`옵션 ${i + 1} 삭제`}
                onClick={() => handleRemoveOption(i)}
                className="flex-shrink-0 text-grey-80 transition-colors lg:hover:text-grey-100"
              >
                <X size={24} />
              </button>
            ) : (
              <span className="w-6 flex-shrink-0" />
            )}
          </div>
        ))}

        {/* 옵션 추가 */}
        <div className="ml-9 flex items-center gap-3 text-m font-medium">
          <button
            type="button"
            onClick={handleAddOption}
            className="text-green-80 transition-opacity lg:hover:opacity-80"
          >
            옵션 추가
          </button>
        </div>
      </div>
    </>
  );
}

function ScoreEditor({ field, onChange }: EditorProps<ScoreField>) {
  const update = (patch: Partial<ScoreField>) =>
    onChange({ ...field, ...patch });
  return (
    <>
      <HeaderInput
        value={field.label}
        onChange={(label) => update({ label })}
        placeholder="질문"
        ariaLabel="항목 입력"
      />
      <div className="mt-5 flex flex-col gap-3">
        {/* 범위 — 1~10 드롭다운, 최소<최대가 되도록 선택지 제한 */}
        <div className="flex items-center gap-6">
          <ScoreRangeSelect
            value={field.min}
            options={scoreRange(SCORE_LIMIT_MIN, field.max - 1)}
            ariaLabel="점수 최소값"
            onChange={(min) => update({ min })}
          />
          <span className="text-l font-medium text-grey-100">~</span>
          <ScoreRangeSelect
            value={field.max}
            options={scoreRange(field.min + 1, SCORE_LIMIT_MAX)}
            ariaLabel="점수 최대값"
            onChange={(max) => update({ max })}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-grey-40" />
          <span className="w-7 flex-shrink-0 text-center text-l font-medium text-grey-100">
            {field.min}
          </span>
          <input
            type="text"
            value={field.minLabel ?? ''}
            onChange={(e) => update({ minLabel: e.target.value })}
            placeholder="라벨 (선택 사항)"
            aria-label="점수 최소값 라벨"
            className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-2 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-grey-40" />
          <span className="w-7 flex-shrink-0 text-center text-l font-medium text-grey-100">
            {field.max}
          </span>
          <input
            type="text"
            value={field.maxLabel ?? ''}
            onChange={(e) => update({ maxLabel: e.target.value })}
            placeholder="라벨 (선택 사항)"
            aria-label="점수 최대값 라벨"
            className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-2 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}

function ConsentFieldEditor({ field, onChange }: EditorProps<ConsentField>) {
  const update = (patch: Partial<ConsentField>) =>
    onChange({ ...field, ...patch });
  return (
    <>
      <HeaderInput
        value={field.label}
        onChange={(label) => update({ label })}
        placeholder="질문"
        ariaLabel="항목 입력"
      />
      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={field.sensitive}
          onChange={(e) => update({ sensitive: e.target.checked })}
          className="h-5 w-5 flex-shrink-0 accent-green-80"
        />
        <span className="text-m font-medium text-grey-100">
          민감정보 동의 항목 (개인정보 보호법 별도 동의)
        </span>
      </label>
    </>
  );
}

/** 활성 필드 본문 — 변형별 에디터로 분기(switch narrowing → 구체 변형 전달). */
export function FieldBody({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updated: FormField) => void;
}) {
  switch (field.type) {
    case 'section':
      return <SectionEditor field={field} onChange={onChange} />;
    case 'richtext':
      return <RichtextEditor field={field} onChange={onChange} />;
    case 'short':
    case 'long':
      return <TextEditor field={field} onChange={onChange} />;
    case 'single':
    case 'multiple':
      return <ChoiceEditor field={field} onChange={onChange} />;
    case 'score':
      return <ScoreEditor field={field} onChange={onChange} />;
    case 'consent':
      return <ConsentFieldEditor field={field} onChange={onChange} />;
    default: {
      // 컴파일 타임 exhaustiveness — 새 유형 추가 시 여기서 에러.
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }
}
