import { useMemo, useState } from 'react';

import { cn } from '@/lib/cn';

import { QnaQuestionContent } from '../../document/components/QnaQuestionContent';
import { parseQnaQuestions } from '../../document/constants/qnaQuestion';
import type { QnaAnswer, QnaQuestion } from '../../document/types';
import type { SharedDocument } from '../api/sharedDocumentApi';

import { SharedHeader } from './SharedHeader';

interface SharedQnaFunnelProps {
  doc: SharedDocument;
  answers: Record<string, QnaAnswer>;
  onAnswerChange: (questionId: string, patch: Partial<QnaAnswer>) => void;
  submitting: boolean;
  /** 첫 문항에서 "이전" — 진입 화면으로 */
  onBack: () => void;
  onSubmit: () => void;
}

/** 모든 문항 필수 — 유형별 "응답됨" 판정(section은 응답 불필요). */
function isAnswered(q: QnaQuestion, a: QnaAnswer | undefined): boolean {
  if (q.type === 'section') return true;
  if (!a) return false;
  switch (q.type) {
    case 'short':
    case 'long':
      return !!a.text?.trim();
    case 'single':
    case 'multiple':
      return (
        (a.selected?.length ?? 0) > 0 ||
        (!!a.etcChecked && !!a.etcText?.trim())
      );
    case 'score':
      return a.score != null;
    default:
      return true;
  }
}

/**
 * 질문응답 퍼널(모바일) — 한 문항 = 한 페이지, 이전/다음. 모든 문항 필수라
 * 현재 문항이 응답돼야 "다음" 활성. 마지막 문항에서 "제출하기".
 */
export function SharedQnaFunnel({
  doc,
  answers,
  onAnswerChange,
  submitting,
  onBack,
  onSubmit,
}: SharedQnaFunnelProps) {
  const questions = useMemo(
    () =>
      parseQnaQuestions(
        JSON.stringify(
          (doc.content as { questions?: unknown }).questions ?? []
        )
      ),
    [doc.content]
  );

  const [index, setIndex] = useState(0);
  const total = questions.length;
  const question = questions[index];

  // 비-섹션 문항 기준 번호(Q번호) — 현재 문항까지의 비섹션 개수.
  const questionNumber = useMemo(() => {
    if (!question || question.type === 'section') return undefined;
    let n = 0;
    for (let i = 0; i <= index; i += 1) {
      if (questions[i].type !== 'section') n += 1;
    }
    return n;
  }, [questions, index, question]);

  if (!question) {
    return (
      <div className="flex h-dvh flex-col bg-white">
        <SharedHeader title={doc.documentTitle} onBack={onBack} />
        <p className="px-6 pt-10 text-base font-medium text-grey-80">
          표시할 문항이 없어요.
        </p>
      </div>
    );
  }

  const isLast = index === total - 1;
  const answered = isAnswered(question, answers[question.id]);

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
        <QnaQuestionContent
          key={question.id}
          question={question}
          number={questionNumber}
          answer={answers[question.id]}
          onAnswerChange={(patch) => onAnswerChange(question.id, patch)}
        />
      </div>

      {/* 이전 / 다음(또는 제출) */}
      <div className="flex flex-shrink-0 items-center gap-3 px-5 pb-7 pt-2">
        <button
          type="button"
          onClick={goPrev}
          className="h-[50px] w-[71px] flex-shrink-0 rounded-lg border border-grey-40 text-base font-medium text-grey-70 transition-colors active:bg-grey-10"
        >
          이전
        </button>
        <button
          type="button"
          disabled={!answered || submitting}
          onClick={goNext}
          className={cn(
            'h-[50px] flex-1 rounded-lg text-base font-medium transition-colors',
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
