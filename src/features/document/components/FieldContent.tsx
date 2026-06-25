import DOMPurify from 'dompurify';
import { Check } from 'lucide-react';

import type {
  ChoiceAnswer,
  ConsentAnswer,
  FieldAnswer,
  FormField,
  ScoreAnswer,
  SignatureAnswer,
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
  /** 서명 입력 트리거 — signature 필드 입력 모드에서 캔버스 시트를 연다 */
  onRequestSignature?: () => void;
}

/** 응답을 각 답변 타입으로 좁혀 읽는 헬퍼 (잘못된 타입이면 undefined) */
function asText(a: FieldAnswer | undefined): TextAnswer | undefined {
  return a && 'text' in a ? a : undefined;
}
function asChoice(a: FieldAnswer | undefined): ChoiceAnswer | undefined {
  return a && 'selected' in a ? a : undefined;
}
function asScore(a: FieldAnswer | undefined): ScoreAnswer | undefined {
  return a && 'score' in a ? a : undefined;
}
function asConsent(a: FieldAnswer | undefined): ConsentAnswer | undefined {
  return a && 'agreed' in a ? a : undefined;
}
function asSignature(a: FieldAnswer | undefined): SignatureAnswer | undefined {
  return a && 'signatureDataUrl' in a ? a : undefined;
}

/**
 * 양식 필드 콘텐츠 — 편집 뷰의 비활성 카드(정적)와 응답 화면(입력)이 공유.
 * 9개 유형을 모두 렌더링한다. 선택형 응답은 옵션 value 기준으로 저장/표시한다.
 * richtext는 DOMPurify로 sanitize한 HTML을 렌더.
 */
export function FieldContent({
  field,
  number,
  answer,
  onAnswerChange,
  onRequestSignature,
}: FieldContentProps) {
  const interactive = onAnswerChange !== undefined;

  // ── richtext: 안내문(리치 HTML) ───────────────────────────────────────────
  if (field.type === 'richtext') {
    return (
      <div
        className="font-medium leading-[150%] text-grey-100 [&_h1]:font-headline [&_h1]:text-[28px] [&_h2]:font-headline [&_h2]:text-2xl"
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
          className={`text-l font-emphasize leading-[150%] lg:text-[28px] ${
            field.title ? 'text-grey-100' : 'text-grey-80'
          }`}
        >
          {field.title || '제목'}
        </p>
        <p
          className={`mt-6 whitespace-pre-wrap text-m font-medium lg:text-xl ${
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
      className={`text-l font-emphasize leading-[150%] lg:text-[28px] ${
        label ? 'text-grey-100' : 'text-grey-80'
      }`}
    >
      {label
        ? `${number !== undefined ? `Q${number}. ` : ''}${label}`
        : '질문'}
    </p>
  );

  return (
    <div>
      {heading}

      {(field.type === 'single' || field.type === 'multiple') && (
        <ChoiceBody
          field={field}
          answer={asChoice(answer)}
          interactive={interactive}
          onAnswerChange={onAnswerChange}
        />
      )}

      {field.type === 'short' &&
        (interactive ? (
          <input
            type="text"
            value={asText(answer)?.text ?? ''}
            onChange={(e) => onAnswerChange?.({ text: e.target.value })}
            placeholder="답변을 입력해주세요."
            aria-label="답변 입력"
            className="mt-6 flex h-[46px] w-full items-center rounded-lg border border-grey-40 bg-grey-20 px-4 text-m font-medium text-grey-100 placeholder:text-grey-60 focus:outline-none lg:text-xl"
          />
        ) : asText(answer)?.text ? (
          <div className="mt-6 flex min-h-[46px] items-center rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-m font-medium text-grey-100 lg:text-xl">
            {asText(answer)?.text}
          </div>
        ) : (
          <div className="mt-6 flex h-[46px] items-center rounded-lg border border-grey-40 bg-grey-20 px-4 text-m font-medium text-grey-60 lg:text-xl">
            답변을 입력해주세요.
          </div>
        ))}

      {field.type === 'long' &&
        (interactive ? (
          <textarea
            value={asText(answer)?.text ?? ''}
            onChange={(e) => onAnswerChange?.({ text: e.target.value })}
            placeholder="답변을 입력해주세요."
            aria-label="답변 입력"
            className="mt-6 block h-[134px] w-full resize-none rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-m font-medium text-grey-100 placeholder:text-grey-60 focus:outline-none lg:text-xl"
          />
        ) : asText(answer)?.text ? (
          <div className="mt-6 min-h-[134px] whitespace-pre-wrap rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-m font-medium text-grey-100 lg:text-xl">
            {asText(answer)?.text}
          </div>
        ) : (
          <div className="mt-6 h-[134px] rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-m font-medium text-grey-60 lg:text-xl">
            답변을 입력해주세요.
          </div>
        ))}

      {field.type === 'score' && (
        <ScoreBody
          field={field}
          answer={asScore(answer)}
          interactive={interactive}
          onAnswerChange={onAnswerChange}
        />
      )}

      {field.type === 'consent' &&
        (() => {
          const agreed = asConsent(answer)?.agreed ?? false;
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
            <span className="text-m font-medium text-grey-100 lg:text-xl">
              동의합니다
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

      {field.type === 'signature' && (
        <SignatureBody
          field={field}
          answer={asSignature(answer)}
          interactive={interactive}
          onRequestSignature={onRequestSignature}
        />
      )}
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
              className={`text-m font-medium lg:text-xl ${
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
  const scoreCircleClass =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-grey-40 bg-white text-xl font-bold text-grey-100';

  return (
    <div className="mt-6">
      {interactive ? (
        <div className="relative h-9">
          <span className="absolute left-[18px] right-[18px] top-1/2 h-2 -translate-y-1/2 bg-grey-40" />
          {score !== undefined && score > scoreMin && (
            <span
              className="absolute left-[18px] top-1/2 h-2 -translate-y-1/2 bg-green-80"
              style={{
                width: `calc((100% - 36px) * ${
                  (score - scoreMin) / (scoreMax - scoreMin)
                })`,
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
              className="absolute top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-green-80 text-xl font-bold text-white"
              style={{
                left: `calc((100% - 36px) * ${
                  (score - scoreMin) / (scoreMax - scoreMin)
                })`,
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
                width: `calc((100% - 36px) * ${
                  (score - scoreMin) / (scoreMax - scoreMin)
                })`,
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
            className="absolute top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-green-80 text-xl font-bold text-white"
            style={{
              left: `calc((100% - 36px) * ${
                (score - scoreMin) / (scoreMax - scoreMin)
              })`,
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
      {(field.minLabel || field.maxLabel) && (
        <div className="mt-3 flex items-center justify-between gap-4 text-m font-medium text-grey-60">
          <span>{field.minLabel}</span>
          <span className="text-right">{field.maxLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── 서명 본문 ────────────────────────────────────────────────────────────────
function SignatureBody({
  field,
  answer,
  interactive,
  onRequestSignature,
}: {
  field: Extract<FormField, { type: 'signature' }>;
  answer: SignatureAnswer | undefined;
  interactive: boolean;
  onRequestSignature?: () => void;
}) {
  const signed = !!answer?.signatureDataUrl;
  return (
    <div className="mt-6">
      {field.helpText && (
        <p className="mb-3 text-m font-medium text-grey-60 lg:text-xl">
          {field.helpText}
        </p>
      )}
      {signed ? (
        <img
          src={answer?.signatureDataUrl}
          alt="서명"
          // 내담자(작성, interactive): full width 자동 높이 / 상담사 읽기전용 뷰: 높이 200 고정·중앙정렬
          className={`rounded-lg border border-grey-40 bg-white object-contain p-2 ${
            interactive ? 'h-auto w-full' : 'mx-auto block h-[200px] w-auto'
          }`}
        />
      ) : interactive ? (
        <button
          type="button"
          onClick={onRequestSignature}
          className="flex h-[60px] w-full items-center justify-center rounded-lg border border-dashed border-grey-40 bg-grey-20 text-m font-medium text-grey-70 lg:text-xl"
        >
          서명하기
        </button>
      ) : (
        <div className="flex h-[60px] w-full items-center justify-center rounded-lg border border-dashed border-grey-40 bg-grey-20 text-m font-medium text-grey-60 lg:text-xl">
          서명란
        </div>
      )}
    </div>
  );
}
