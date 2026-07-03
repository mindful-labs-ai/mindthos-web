import DOMPurify from 'dompurify';
import { Check } from 'lucide-react';

import type {
  ChoiceAnswer,
  ConsentAnswer,
  FieldAnswer,
  FormField,
  FormFieldType,
  ScoreAnswer,
  TextAnswer,
} from '../types';

interface FieldContentProps {
  field: FormField;
  /** 뷰 페이지 필드 번호 — "Q1." 접두사 (section/richtext 제외, 편집 뷰에선 미사용) */
  number?: number;
  /** 응답 값 — onAnswerChange와 함께 전달 시 응답 입력 모드 */
  answer?: FieldAnswer;
  /** 전달되면 응답 입력 가능(뷰 페이지), 없으면 정적 표시(편집 뷰 비활성 카드/읽기전용) */
  onAnswerChange?: (answer: FieldAnswer) => void;
}

/** 필드 type(판별자)별로 대응되는 답변 타입. */
type AnswerFor<F extends FormField> = F['type'] extends 'short' | 'long'
  ? TextAnswer
  : F['type'] extends 'single' | 'multiple'
    ? ChoiceAnswer
    : F['type'] extends 'score'
      ? ScoreAnswer
      : F['type'] extends 'consent'
        ? ConsentAnswer
        : never;

/**
 * 응답을 필드 type(판별자) 기준으로 해당 답변 타입에 맞춰 읽는다.
 * 답변 키를 추측하지 않고 field.type별로 기대 키만 검증하므로, 새 필드/답변 타입이
 * 추가되면 switch의 exhaustiveness(never)로 컴파일 에러가 나 조용히 잘못 렌더되지 않는다.
 * 기대 키가 없는(타입 불일치 손상) 응답이면 undefined.
 */
function answerForField<F extends FormField>(
  field: F,
  answer: FieldAnswer | undefined
): AnswerFor<F> | undefined {
  if (answer === undefined) return undefined;
  const fieldType: FormFieldType = field.type;
  const hasExpectedKey = (): boolean => {
    switch (fieldType) {
      case 'short':
      case 'long':
        return 'text' in answer;
      case 'single':
      case 'multiple':
        return 'selected' in answer;
      case 'score':
        return 'score' in answer;
      case 'consent':
        return 'agreed' in answer;
      case 'section':
      case 'richtext':
        return false;
      default: {
        const _exhaustive: never = fieldType;
        return _exhaustive;
      }
    }
  };
  return hasExpectedKey() ? (answer as AnswerFor<F>) : undefined;
}

/**
 * 양식 필드 콘텐츠 — 편집 뷰의 비활성 카드(정적)와 응답 화면(입력)이 공유.
 * 8개 유형을 모두 렌더링한다. 선택형 응답은 옵션 value 기준으로 저장/표시한다.
 * richtext는 DOMPurify로 sanitize한 HTML을 렌더. (서명은 필드가 아니라 문서 레벨 — 여기서 다루지 않는다.)
 */
export function FieldContent({
  field,
  number,
  answer,
  onAnswerChange,
}: FieldContentProps) {
  const interactive = onAnswerChange !== undefined;

  // ── richtext: 안내문(리치 HTML) ───────────────────────────────────────────
  if (field.type === 'richtext') {
    return (
      <div
        className="font-medium leading-[150%] text-grey-100 [&_h1]:text-xl [&_h1]:font-headline [&_h2]:text-xl [&_h2]:font-headline"
        // 상담사가 작성한 HTML — 클라이언트에서 DOMPurify로 sanitize(방어적).
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(field.html) }}
      />
    );
  }

  // ── section: 제목 및 설명 ─────────────────────────────────────────────────
  if (field.type === 'section') {
    return (
      <div>
        <p
          className={`text-m font-emphasize leading-[150%] lg:text-l ${
            field.title ? 'text-grey-100' : 'text-grey-80'
          }`}
        >
          {field.title || '제목'}
        </p>
        <p
          className={`mt-6 whitespace-pre-wrap text-sm font-medium lg:text-l ${
            field.description ? 'text-grey-100' : 'text-grey-60'
          }`}
        >
          {field.description || '설명'}
        </p>
      </div>
    );
  }

  const label = field.label;
  const heading = (
    <p
      className={`text-m font-emphasize leading-[150%] lg:text-l ${
        label ? 'text-grey-100' : 'text-grey-80'
      }`}
    >
      {label ? `${number !== undefined ? `Q${number}. ` : ''}${label}` : '질문'}
    </p>
  );

  return (
    <div>
      {/* consent는 동의 체크 행에 라벨을 함께 표기하므로 제목을 중복 렌더하지 않는다. */}
      {field.type !== 'consent' && heading}

      {/* 다중 선택은 내담자가 인지하기 어려워 제목 바로 아래에 작게 안내(단일은 라디오로 자명). */}
      {field.type === 'multiple' && (
        <p className="mt-1 text-sm font-medium text-grey-60">복수 선택 가능</p>
      )}

      {(field.type === 'single' || field.type === 'multiple') && (
        <ChoiceBody
          field={field}
          answer={answerForField(field, answer)}
          interactive={interactive}
          onAnswerChange={onAnswerChange}
        />
      )}

      {field.type === 'short' &&
        (interactive ? (
          <input
            type="text"
            value={answerForField(field, answer)?.text ?? ''}
            onChange={(e) => onAnswerChange?.({ text: e.target.value })}
            placeholder="답변을 입력해주세요."
            aria-label="답변 입력"
            className="mt-6 flex h-[46px] w-full items-center rounded-lg border border-grey-40 bg-grey-20 px-4 text-sm font-medium text-grey-100 placeholder:text-grey-60 focus:outline-none lg:text-l"
          />
        ) : answerForField(field, answer)?.text ? (
          <div className="mt-6 flex min-h-[46px] items-center rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-sm font-medium text-grey-100 lg:text-l">
            {answerForField(field, answer)?.text}
          </div>
        ) : (
          <div className="mt-6 flex h-[46px] items-center rounded-lg border border-grey-40 bg-grey-20 px-4 text-sm font-medium text-grey-60 lg:text-l">
            답변을 입력해주세요.
          </div>
        ))}

      {field.type === 'long' &&
        (interactive ? (
          <textarea
            value={answerForField(field, answer)?.text ?? ''}
            onChange={(e) => onAnswerChange?.({ text: e.target.value })}
            placeholder="답변을 입력해주세요."
            aria-label="답변 입력"
            className="mt-6 block h-[134px] w-full resize-none rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-sm font-medium text-grey-100 placeholder:text-grey-60 focus:outline-none lg:text-l"
          />
        ) : answerForField(field, answer)?.text ? (
          <div className="mt-6 min-h-[134px] whitespace-pre-wrap rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-sm font-medium text-grey-100 lg:text-l">
            {answerForField(field, answer)?.text}
          </div>
        ) : (
          <div className="mt-6 h-[134px] rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-sm font-medium text-grey-60 lg:text-l">
            답변을 입력해주세요.
          </div>
        ))}

      {field.type === 'score' && (
        <ScoreBody
          field={field}
          answer={answerForField(field, answer)}
          interactive={interactive}
          onAnswerChange={onAnswerChange}
        />
      )}

      {field.type === 'consent' &&
        (() => {
          const agreed = answerForField(field, answer)?.agreed ?? false;
          const marker = (
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[4px] border-2 ${
                agreed
                  ? 'border-green-80 bg-green-80 text-white'
                  : 'border-grey-40 bg-white'
              }`}
            >
              {agreed && <Check size={16} />}
            </span>
          );
          const text = (
            <span className="text-sm font-medium text-grey-100 lg:text-l">
              {label || '동의합니다'}
            </span>
          );
          return (
            <div className="mt-6">
              {interactive ? (
                <button
                  type="button"
                  aria-pressed={agreed}
                  onClick={() => onAnswerChange?.({ agreed: !agreed })}
                  className="flex w-fit items-center gap-3 text-left"
                >
                  {marker}
                  {text}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  {marker}
                  {text}
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}

// ── 선택형 본문 ──────────────────────────────────────────────────────────────
function ChoiceBody({
  field,
  answer,
  interactive,
  onAnswerChange,
}: {
  field: Extract<FormField, { type: 'single' | 'multiple' }>;
  answer: ChoiceAnswer | undefined;
  interactive: boolean;
  onAnswerChange?: (answer: FieldAnswer) => void;
}) {
  const selected = answer?.selected ?? [];

  const handleSelect = (value: string) => {
    if (!onAnswerChange) return;
    if (field.type === 'single') {
      onAnswerChange({ selected: [value] });
    } else {
      onAnswerChange({
        selected: selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value],
      });
    }
  };

  const renderMarker = (isSelected: boolean) =>
    field.type === 'multiple' ? (
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[4px] border-2 ${
          isSelected
            ? 'border-green-80 bg-green-80 text-white'
            : 'border-grey-40 bg-white'
        }`}
      >
        {isSelected && <Check size={16} />}
      </span>
    ) : (
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white ${
          isSelected ? 'border-green-80' : 'border-grey-40'
        }`}
      >
        {isSelected && <span className="h-3 w-3 rounded-full bg-green-80" />}
      </span>
    );

  return (
    <div className="mt-6 flex flex-col gap-3">
      {field.options.map((option, i) => {
        const isSelected = selected.includes(option.value);
        const optionContent = (
          <>
            {renderMarker(isSelected)}
            <span
              className={`text-sm font-medium lg:text-l ${
                option.label ? 'text-grey-100' : 'text-grey-80'
              }`}
            >
              {option.label || `옵션 ${i + 1}`}
            </span>
          </>
        );
        return interactive ? (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className="flex w-fit items-center gap-3 text-left"
          >
            {optionContent}
          </button>
        ) : (
          <div key={option.value} className="flex items-center gap-3">
            {optionContent}
          </div>
        );
      })}
    </div>
  );
}

// ── 점수 본문 ────────────────────────────────────────────────────────────────
function ScoreBody({
  field,
  answer,
  interactive,
  onAnswerChange,
}: {
  field: Extract<FormField, { type: 'score' }>;
  answer: ScoreAnswer | undefined;
  interactive: boolean;
  onAnswerChange?: (answer: FieldAnswer) => void;
}) {
  const scoreMin = field.min;
  const scoreMax = field.max;
  const score = answer?.score;
  // min===max인 손상 데이터에서 0으로 나눠 폭/위치가 NaN이 되는 것 방지.
  const scoreRatio = (s: number) =>
    scoreMax > scoreMin ? (s - scoreMin) / (scoreMax - scoreMin) : 0;
  const scoreCircleClass =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-grey-40 bg-white text-l font-bold text-grey-100';

  return (
    <div className="mt-6">
      {interactive ? (
        <div className="relative h-9">
          <span className="absolute left-[18px] right-[18px] top-1/2 h-2 -translate-y-1/2 bg-grey-40" />
          {score !== undefined && score > scoreMin && (
            <span
              className="absolute left-[18px] top-1/2 h-2 -translate-y-1/2 bg-green-80"
              style={{
                width: `calc((100% - 36px) * ${scoreRatio(score)})`,
              }}
            />
          )}
          <span className={`${scoreCircleClass} absolute left-0 top-0`}>
            {scoreMin}
          </span>
          <span className={`${scoreCircleClass} absolute right-0 top-0`}>
            {scoreMax}
          </span>
          {score !== undefined && (
            <span
              className="absolute top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-green-80 text-l font-bold text-white"
              style={{
                left: `calc((100% - 36px) * ${scoreRatio(score)})`,
              }}
            >
              {score}
            </span>
          )}
          <input
            type="range"
            min={scoreMin}
            max={scoreMax}
            step={1}
            value={score ?? scoreMin}
            onChange={(e) =>
              onAnswerChange?.({ score: Number(e.target.value) })
            }
            onPointerUp={(e) =>
              onAnswerChange?.({ score: Number(e.currentTarget.value) })
            }
            aria-label="점수 선택"
            className="absolute inset-0 z-20 h-full w-full cursor-pointer appearance-none opacity-0"
          />
        </div>
      ) : score != null ? (
        <div className="relative h-9">
          <span className="absolute left-[18px] right-[18px] top-1/2 h-2 -translate-y-1/2 bg-grey-40" />
          {score > scoreMin && (
            <span
              className="absolute left-[18px] top-1/2 h-2 -translate-y-1/2 bg-green-80"
              style={{
                width: `calc((100% - 36px) * ${scoreRatio(score)})`,
              }}
            />
          )}
          <span className={`${scoreCircleClass} absolute left-0 top-0`}>
            {scoreMin}
          </span>
          <span className={`${scoreCircleClass} absolute right-0 top-0`}>
            {scoreMax}
          </span>
          <span
            className="absolute top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-green-80 text-l font-bold text-white"
            style={{
              left: `calc((100% - 36px) * ${scoreRatio(score)})`,
            }}
          >
            {score}
          </span>
        </div>
      ) : (
        <div className="flex items-center">
          <span className={scoreCircleClass}>{scoreMin}</span>
          <span className="h-2 min-w-0 flex-1 bg-grey-40" />
          <span className={scoreCircleClass}>{scoreMax}</span>
        </div>
      )}
      {/* 척도 라벨 — scaleOptions(값별 상태: 0=전혀 아니다 … 3=거의 매일)는 각 눈금 아래에 표시.
          scaleOptions가 없으면 양끝(min/max) 라벨만. */}
      {field.scaleOptions && field.scaleOptions.length > 0 ? (
        <div className="relative mt-2 h-9">
          {field.scaleOptions.map((opt, i, arr) => {
            const ratio = scoreRatio(Number(opt.value));
            const isFirst = i === 0;
            const isLast = i === arr.length - 1;
            return (
              <span
                key={opt.value}
                className={`absolute top-0 w-16 break-keep text-xs font-medium leading-tight text-grey-60 ${
                  isFirst ? 'text-left' : isLast ? 'text-right' : 'text-center'
                }`}
                style={
                  isFirst
                    ? { left: 0 }
                    : isLast
                      ? { right: 0 }
                      : {
                          left: `calc((100% - 36px) * ${ratio} + 18px)`,
                          transform: 'translateX(-50%)',
                        }
                }
              >
                {opt.label}
              </span>
            );
          })}
        </div>
      ) : (
        (field.minLabel || field.maxLabel) && (
          <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-grey-60">
            <span>{field.minLabel}</span>
            <span className="text-right">{field.maxLabel}</span>
          </div>
        )
      )}
    </div>
  );
}
