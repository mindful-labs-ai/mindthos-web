import { useEffect, useRef } from 'react';

import { Copy, Trash2, X } from 'lucide-react';

import { isChoiceQuestion } from '../../constants/qnaQuestion';
import type { QnaQuestion } from '../../types';
import { QnaQuestionContent } from '../QnaQuestionContent';

import { QuestionTypeDropdown } from './QuestionTypeDropdown';
import { ScoreRangeSelect } from './ScoreRangeSelect';

/** 점수 범위 전체 한계 — 1~10 */
const SCORE_LIMIT_MIN = 1;
const SCORE_LIMIT_MAX = 10;

/** from~to 정수 목록 */
function scoreRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

interface QuestionCardProps {
  question: QnaQuestion;
  /** 활성(편집 중) 카드 — 초록 보더 */
  isActive: boolean;
  onActivate: () => void;
  onChange: (patch: Partial<QnaQuestion>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * 질문·응답 항목 카드.
 * 활성(선택된) 항목만 입력 UI + 복제/삭제/유형 드롭다운을 보여주고,
 * 비활성 항목은 정적 콘텐츠로 표시 — 클릭하면 활성화된다.
 * 점수는 범위 선택(기본 1~5) + 최소/최대 라벨(선택 사항) 입력.
 */
export function QuestionCard({
  question,
  isActive,
  onActivate,
  onChange,
  onDuplicate,
  onDelete,
}: QuestionCardProps) {
  // 옵션 input Tab 이동/추가용 — 새로 만든 옵션은 렌더 후 포커스
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex.current !== null) {
      optionInputRefs.current[pendingFocusIndex.current]?.focus();
      pendingFocusIndex.current = null;
    }
  });

  if (!isActive) {
    return (
      <button
        type="button"
        onClick={onActivate}
        className="w-full rounded-2xl border border-grey-40 bg-white p-7 text-left"
      >
        <QnaQuestionContent question={question} />
      </button>
    );
  }

  const handleOptionChange = (index: number, value: string) => {
    onChange({
      options: question.options.map((o, i) => (i === index ? value : o)),
    });
  };

  const handleRemoveOption = (index: number) => {
    onChange({ options: question.options.filter((_, i) => i !== index) });
  };

  const handleAddOption = () => {
    onChange({ options: [...question.options, ''] });
  };

  // Tab: 다음 옵션으로 이동, 마지막 옵션이면 새 옵션 추가 후 이동
  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    if (index < question.options.length - 1) {
      optionInputRefs.current[index + 1]?.focus();
    } else {
      pendingFocusIndex.current = index + 1;
      handleAddOption();
    }
  };

  // 옵션 마커 — 단일 선택은 원형, 다중 선택은 사각(체크박스)
  const markerClass = `h-6 w-6 flex-shrink-0 border-2 border-grey-40 ${
    question.type === 'multiple' ? 'rounded-[4px]' : 'rounded-full'
  }`;

  return (
    <div
      onFocusCapture={onActivate}
      className="rounded-2xl border border-green-80 bg-white p-7"
    >
      {/* 질문 */}
      <input
        type="text"
        value={question.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="질문"
        aria-label="질문 입력"
        className="h-[41px] w-full rounded-lg bg-grey-20 px-3 text-xl font-emphasize text-grey-100 placeholder:text-grey-80 focus:outline-none"
      />

      {/* 본문 — 선택형(단일/다중) */}
      {isChoiceQuestion(question.type) && (
        <div className="mt-5 flex flex-col gap-3">
          {question.options.map((option, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={markerClass} />
              <input
                ref={(el) => {
                  optionInputRefs.current[i] = el;
                }}
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(i, e.target.value)}
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

          {/* 기타 옵션 — 자유 입력 자리(언더라인), 제작 화면에서는 표시만 */}
          {question.hasEtcOption && (
            <div className="flex items-center gap-3">
              <span className={markerClass} />
              <div className="flex h-[34px] min-w-0 flex-1 items-center px-3">
                <span className="flex-shrink-0 text-m font-medium text-grey-80">
                  기타 :
                </span>
                <span className="mb-0.5 ml-2 flex-1 self-end border-b border-grey-40" />
              </div>
              <button
                type="button"
                aria-label="기타 옵션 삭제"
                onClick={() => onChange({ hasEtcOption: false })}
                className="flex-shrink-0 text-grey-80 transition-colors lg:hover:text-grey-100"
              >
                <X size={24} />
              </button>
            </div>
          )}

          {/* 옵션 추가 | 기타 추가 */}
          <div className="ml-9 flex items-center gap-3 text-m font-medium">
            <button
              type="button"
              onClick={handleAddOption}
              className="text-green-80 transition-opacity lg:hover:opacity-80"
            >
              옵션 추가
            </button>
            {!question.hasEtcOption && (
              <>
                <span className="text-grey-80">|</span>
                <button
                  type="button"
                  onClick={() => onChange({ hasEtcOption: true })}
                  className="text-grey-80 transition-colors lg:hover:text-grey-100"
                >
                  기타 추가
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 본문 — 단답형/장문형: 응답 자리 미리보기 */}
      {question.type === 'short' && (
        <div className="mt-5 flex h-[34px] items-center rounded-lg bg-grey-20 px-3 text-m font-medium text-grey-80">
          답변
        </div>
      )}

      {question.type === 'long' && (
        <div className="mt-5 h-[100px] rounded-lg bg-grey-20 px-3 py-[5px] text-m font-medium text-grey-80">
          답변
        </div>
      )}

      {/* 본문 — 점수: 범위 선택 + 최소/최대 라벨 */}
      {question.type === 'score' && (
        <div className="mt-5 flex flex-col gap-3">
          {/* 범위 — 1~10 드롭다운, 최소<최대가 되도록 선택지 제한 */}
          <div className="flex items-center gap-6">
            <ScoreRangeSelect
              value={question.scoreMin ?? 1}
              options={scoreRange(
                SCORE_LIMIT_MIN,
                (question.scoreMax ?? 5) - 1
              )}
              ariaLabel="점수 최소값"
              onChange={(scoreMin) => onChange({ scoreMin })}
            />
            <span className="text-xl font-medium text-grey-100">~</span>
            <ScoreRangeSelect
              value={question.scoreMax ?? 5}
              options={scoreRange(
                (question.scoreMin ?? 1) + 1,
                SCORE_LIMIT_MAX
              )}
              ariaLabel="점수 최대값"
              onChange={(scoreMax) => onChange({ scoreMax })}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-grey-40" />
            <span className="w-7 flex-shrink-0 text-center text-xl font-medium text-grey-100">
              {question.scoreMin ?? 1}
            </span>
            <input
              type="text"
              value={question.scoreMinLabel ?? ''}
              onChange={(e) => onChange({ scoreMinLabel: e.target.value })}
              placeholder="라벨 (선택 사항)"
              aria-label="점수 최소값 라벨"
              className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-2 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-grey-40" />
            <span className="w-7 flex-shrink-0 text-center text-xl font-medium text-grey-100">
              {question.scoreMax ?? 5}
            </span>
            <input
              type="text"
              value={question.scoreMaxLabel ?? ''}
              onChange={(e) => onChange({ scoreMaxLabel: e.target.value })}
              placeholder="라벨 (선택 사항)"
              aria-label="점수 최대값 라벨"
              className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-2 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 본문 — 제목 및 설명 */}
      {question.type === 'section' && (
        <textarea
          value={question.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="설명"
          aria-label="설명 입력"
          className="mt-5 block h-[100px] w-full resize-none rounded-lg bg-grey-20 px-3 py-[5px] text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
        />
      )}

      {/* 하단 액션: 복제 · 삭제 · 유형 드롭다운 */}
      <div className="mt-6 flex items-center justify-end gap-10">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onDuplicate}
            className="flex items-center gap-1 text-m font-medium text-grey-80 transition-colors lg:hover:text-grey-100"
          >
            <Copy size={20} />
            복제
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 text-m font-medium text-grey-80 transition-colors lg:hover:text-grey-100"
          >
            <Trash2 size={20} />
            삭제
          </button>
        </div>
        <QuestionTypeDropdown
          type={question.type}
          onChange={(type) => onChange({ type })}
        />
      </div>
    </div>
  );
}
