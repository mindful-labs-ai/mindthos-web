import { useMemo, useState } from 'react';

import { cn } from '@/lib/cn';

import { FieldContent } from '../../document/components/FieldContent';
import { parseFields } from '../../document/constants/formField';
import type {
  FieldAnswer,
  FormField,
  RichtextField,
  SectionField,
} from '../../document/types';
import type { SharedDocument } from '../api/sharedDocumentApi';

import { SharedHeader } from './SharedHeader';

interface SharedQnaFunnelProps {
  doc: SharedDocument;
  answers: Record<string, FieldAnswer>;
  onAnswerChange: (fieldKey: string, answer: FieldAnswer) => void;
  submitting: boolean;
  /** 첫 필드에서 "이전" — 진입 화면으로 */
  onBack: () => void;
  onSubmit: () => void;
}

/** 응답 불필요(정보) 필드 — section/richtext (타입가드: 이후 분기에서 required 접근 가능). */
function isInfoField(field: FormField): field is SectionField | RichtextField {
  return field.type === 'section' || field.type === 'richtext';
}

/**
 * 유형별 "응답됨" 판정. 정보 필드(section/richtext)는 응답 불필요,
 * required=false 필드는 미응답 허용(건너뛰기 가능). 선택형은 옵션 선택 또는 '기타' 입력으로 충족.
 */
function isAnswered(
  field: FormField,
  answer: FieldAnswer | undefined
): boolean {
  if (isInfoField(field)) return true;
  // 선택(필수 아님) 필드는 응답 없이도 통과.
  if (!field.required) return true;
  if (!answer) return false;
  switch (field.type) {
    case 'short':
    case 'long':
      return 'text' in answer && !!answer.text.trim();
    case 'single':
    case 'multiple':
      return (
        'selected' in answer &&
        (answer.selected.length > 0 || !!answer.otherText?.trim())
      );
    case 'score':
      return 'score' in answer && answer.score != null;
    case 'consent':
      return 'agreed' in answer && answer.agreed === true;
    default:
      return true;
  }
}

/**
 * 질문응답 퍼널(모바일) — 한 필드 = 한 페이지, 이전/다음. 현재 필드가 응답(또는
 * required=false라 건너뛰기 허용)돼야 "다음" 활성. 마지막 필드에서 "제출하기".
 */
export function SharedQnaFunnel({
  doc,
  answers,
  onAnswerChange,
  submitting,
  onBack,
  onSubmit,
}: SharedQnaFunnelProps) {
  const fields = useMemo(() => parseFields(doc.content), [doc.content]);

  const [index, setIndex] = useState(0);
  const total = fields.length;
  const field = fields[index];

  // 비-정보 필드 기준 번호(Q번호) — 현재 필드까지의 비정보 개수.
  const fieldNumber = useMemo(() => {
    if (!field || isInfoField(field)) return undefined;
    let n = 0;
    for (let i = 0; i <= index; i += 1) {
      if (!isInfoField(fields[i])) n += 1;
    }
    return n;
  }, [fields, index, field]);

  if (!field) {
    return (
      <div className="flex h-dvh flex-col bg-white">
        <SharedHeader title={doc.documentTitle} onBack={onBack} />
        <p className="px-6 pt-10 text-m font-medium text-grey-80">
          표시할 문항이 없어요.
        </p>
      </div>
    );
  }

  const isLast = index === total - 1;
  const answered = isAnswered(field, answers[field.key]);

  const goPrev = () => {
    if (index === 0) onBack();
    else setIndex((i) => i - 1);
  };
  const goNext = () => {
    if (!answered) return;
    if (isLast) onSubmit();
    else setIndex((i) => i + 1);
  };

  return (
    <div className="flex h-dvh flex-col bg-white">
      <SharedHeader title={doc.documentTitle} onBack={goPrev} />

      <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6">
        <FieldContent
          key={field.key}
          field={field}
          number={fieldNumber}
          answer={answers[field.key]}
          onAnswerChange={(answer) => onAnswerChange(field.key, answer)}
        />
      </div>

      {/* 이전 / 다음(또는 제출) */}
      <div className="flex flex-shrink-0 items-center gap-3 px-5 pb-7 pt-2">
        <button
          type="button"
          onClick={goPrev}
          className="h-[50px] w-[71px] flex-shrink-0 rounded-lg border border-grey-40 text-m font-medium text-grey-70 transition-colors active:bg-grey-10"
        >
          이전
        </button>
        <button
          type="button"
          disabled={!answered || submitting}
          onClick={goNext}
          className={cn(
            'h-[50px] flex-1 rounded-lg text-m font-medium transition-colors',
            answered && !submitting
              ? 'bg-green-80 text-white'
              : 'cursor-not-allowed bg-grey-20 text-grey-70'
          )}
        >
          {isLast ? (submitting ? '제출 중...' : '제출하기') : '다음'}
        </button>
      </div>
    </div>
  );
}
