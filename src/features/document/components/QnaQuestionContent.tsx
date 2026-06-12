import { Check } from 'lucide-react';

import { isChoiceQuestion } from '../constants/qnaQuestion';
import type { QnaAnswer, QnaQuestion } from '../types';

interface QnaQuestionContentProps {
  question: QnaQuestion;
  /** 뷰 페이지 질문 번호 — "Q1." 접두사 (제목 및 설명 제외, 편집 뷰에선 미사용) */
  number?: number;
  /** 응답 값 — onAnswerChange와 함께 전달 시 응답 입력 모드 */
  answer?: QnaAnswer;
  /** 전달되면 응답 입력 가능(뷰 페이지), 없으면 정적 표시(편집 뷰 비활성 카드) */
  onAnswerChange?: (patch: Partial<QnaAnswer>) => void;
}

/**
 * 질문 항목 콘텐츠 — 편집 뷰의 비활성 카드(정적)와 문서 뷰 페이지(응답 입력)가 공유.
 * 빈 값은 placeholder 색으로 표시하고, 단답/장문은 응답 입력 자리,
 * 점수는 범위 트랙(입력 모드에선 단계 선택)으로 그린다.
 */
export function QnaQuestionContent({
  question,
  number,
  answer,
  onAnswerChange,
}: QnaQuestionContentProps) {
  const interactive = onAnswerChange !== undefined;
  const selected = answer?.selected ?? [];
  const scoreMin = question.scoreMin ?? 1;
  const scoreMax = question.scoreMax ?? 5;

  const handleSelectOption = (index: number) => {
    if (!onAnswerChange) return;
    if (question.type === 'single') {
      onAnswerChange({ selected: [index], etcChecked: false });
    } else {
      onAnswerChange({
        selected: selected.includes(index)
          ? selected.filter((i) => i !== index)
          : [...selected, index],
      });
    }
  };

  const handleToggleEtc = () => {
    if (!onAnswerChange) return;
    if (question.type === 'single') {
      onAnswerChange({ selected: [], etcChecked: !answer?.etcChecked });
    } else {
      onAnswerChange({ etcChecked: !answer?.etcChecked });
    }
  };

  // 옵션 마커 — 단일 선택은 원형(선택 시 안쪽 점), 다중 선택은 사각 체크박스
  const renderMarker = (isSelected: boolean) =>
    question.type === 'multiple' ? (
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

  const scoreCircleClass =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-grey-40 bg-white text-xl font-bold text-grey-100';

  return (
    <div>
      {/* 질문(제목) — 빈 값이면 placeholder 색 */}
      <p
        className={`text-[28px] font-emphasize leading-[150%] ${
          question.title ? 'text-grey-100' : 'text-grey-80'
        }`}
      >
        {question.title
          ? `${number !== undefined ? `Q${number}. ` : ''}${question.title}`
          : question.type === 'section'
            ? '제목'
            : '질문'}
      </p>

      {/* 선택형(단일/다중) — 옵션 + 기타 */}
      {isChoiceQuestion(question.type) && (
        <div className="mt-6 flex flex-col gap-3">
          {question.options.map((option, i) => {
            const optionContent = (
              <>
                {renderMarker(interactive && selected.includes(i))}
                <span
                  className={`text-xl font-medium ${
                    option ? 'text-grey-100' : 'text-grey-80'
                  }`}
                >
                  {option || `옵션 ${i + 1}`}
                </span>
              </>
            );
            return interactive ? (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectOption(i)}
                className="flex w-fit items-center gap-3 text-left"
              >
                {optionContent}
              </button>
            ) : (
              <div key={i} className="flex items-center gap-3">
                {optionContent}
              </div>
            );
          })}
          {question.hasEtcOption && (
            <div className="flex h-[30px] items-center gap-3">
              {interactive ? (
                <button
                  type="button"
                  aria-label="기타 선택"
                  aria-pressed={!!answer?.etcChecked}
                  onClick={handleToggleEtc}
                >
                  {renderMarker(!!answer?.etcChecked)}
                </button>
              ) : (
                renderMarker(false)
              )}
              <span className="flex-shrink-0 text-xl font-medium text-grey-100">
                기타 :
              </span>
              {interactive ? (
                <input
                  type="text"
                  value={answer?.etcText ?? ''}
                  onChange={(e) =>
                    onAnswerChange?.({
                      etcText: e.target.value,
                      etcChecked: true,
                      ...(question.type === 'single' ? { selected: [] } : {}),
                    })
                  }
                  aria-label="기타 입력"
                  className="h-[30px] min-w-0 flex-1 border-b border-grey-40 bg-transparent text-xl font-medium text-grey-100 focus:outline-none"
                />
              ) : (
                <span className="mb-1 min-w-0 flex-1 self-end border-b border-grey-40" />
              )}
            </div>
          )}
        </div>
      )}

      {/* 단답형/장문형 — 응답 입력 자리 */}
      {question.type === 'short' &&
        (interactive ? (
          <input
            type="text"
            value={answer?.text ?? ''}
            onChange={(e) => onAnswerChange?.({ text: e.target.value })}
            placeholder="답변을 입력해주세요."
            aria-label="답변 입력"
            className="mt-6 flex h-[46px] w-full items-center rounded-lg border border-grey-40 bg-grey-20 px-4 text-xl font-medium text-grey-100 placeholder:text-grey-60 focus:outline-none"
          />
        ) : (
          <div className="mt-6 flex h-[46px] items-center rounded-lg border border-grey-40 bg-grey-20 px-4 text-xl font-medium text-grey-60">
            답변을 입력해주세요.
          </div>
        ))}

      {question.type === 'long' &&
        (interactive ? (
          <textarea
            value={answer?.text ?? ''}
            onChange={(e) => onAnswerChange?.({ text: e.target.value })}
            placeholder="답변을 입력해주세요."
            aria-label="답변 입력"
            className="mt-6 block h-[134px] w-full resize-none rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-xl font-medium text-grey-100 placeholder:text-grey-60 focus:outline-none"
          />
        ) : (
          <div className="mt-6 h-[134px] rounded-lg border border-grey-40 bg-grey-20 px-4 py-2 text-xl font-medium text-grey-60">
            답변을 입력해주세요.
          </div>
        ))}

      {/* 점수 — 최소~최대 범위 트랙 (입력 모드: 단계 선택) */}
      {question.type === 'score' && (
        <div className="mt-6">
          {interactive ? (
            // 투명 range input을 위에 깔아 드래그/클릭으로 값 선택,
            // 아래의 원·진행선이 값을 따라가는 커스텀 비주얼
            <div className="relative h-9">
              {/* 트랙 + 선택 값까지의 진행선 (양끝 원 중심 사이) */}
              <span className="absolute left-[18px] right-[18px] top-1/2 h-2 -translate-y-1/2 bg-grey-40" />
              {answer?.score !== undefined && answer.score > scoreMin && (
                <span
                  className="absolute left-[18px] top-1/2 h-2 -translate-y-1/2 bg-green-80"
                  style={{
                    width: `calc((100% - 36px) * ${
                      (answer.score - scoreMin) / (scoreMax - scoreMin)
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
              {answer?.score !== undefined && (
                <span
                  className="absolute top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-green-80 text-xl font-bold text-white"
                  style={{
                    left: `calc((100% - 36px) * ${
                      (answer.score - scoreMin) / (scoreMax - scoreMin)
                    })`,
                  }}
                >
                  {answer.score}
                </span>
              )}
              <input
                type="range"
                min={scoreMin}
                max={scoreMax}
                step={1}
                value={answer?.score ?? scoreMin}
                onChange={(e) =>
                  onAnswerChange?.({ score: Number(e.target.value) })
                }
                // 최소값 자리를 그대로 클릭하면 change가 안 떠서 pointerup에서도 커밋
                onPointerUp={(e) =>
                  onAnswerChange?.({ score: Number(e.currentTarget.value) })
                }
                aria-label="점수 선택"
                className="absolute inset-0 z-20 h-full w-full cursor-pointer appearance-none opacity-0"
              />
            </div>
          ) : (
            <div className="flex items-center">
              <span className={scoreCircleClass}>{scoreMin}</span>
              <span className="h-2 min-w-0 flex-1 bg-grey-40" />
              <span className={scoreCircleClass}>{scoreMax}</span>
            </div>
          )}
          {(question.scoreMinLabel || question.scoreMaxLabel) && (
            <div className="mt-3 flex items-center justify-between gap-4 text-m font-medium text-grey-60">
              <span>{question.scoreMinLabel}</span>
              <span className="text-right">{question.scoreMaxLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* 제목 및 설명 */}
      {question.type === 'section' && (
        <p
          className={`mt-6 whitespace-pre-wrap text-xl font-medium ${
            question.description ? 'text-grey-100' : 'text-grey-60'
          }`}
        >
          {question.description || '설명'}
        </p>
      )}
    </div>
  );
}
