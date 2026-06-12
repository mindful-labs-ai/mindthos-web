import { useState } from 'react';

import { Plus } from 'lucide-react';

import {
  createQnaQuestion,
  duplicateQnaQuestion,
} from '../../constants/qnaQuestion';
import type { QnaQuestion } from '../../types';

import { QuestionCard } from './QuestionCard';

interface QnaEditorProps {
  questions: QnaQuestion[];
  onQuestionsChange: (questions: QnaQuestion[]) => void;
}

/**
 * 질문·응답 양식 에디터 — 항목(질문) 카드 목록 + 하단 + 버튼으로 추가.
 * 항목이 없으면 빈 캔버스 (저장 비활성 조건은 컨테이너에서 처리).
 */
export function QnaEditor({ questions, onQuestionsChange }: QnaEditorProps) {
  // 활성(편집 중) 항목 — 초록 보더 표시
  const [activeId, setActiveId] = useState<string | null>(
    questions[0]?.id ?? null
  );

  const updateQuestion = (id: string, patch: Partial<QnaQuestion>) => {
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  };

  const handleAdd = () => {
    const question = createQnaQuestion();
    onQuestionsChange([...questions, question]);
    setActiveId(question.id);
  };

  const handleDuplicate = (index: number) => {
    const copy = duplicateQnaQuestion(questions[index]);
    onQuestionsChange([
      ...questions.slice(0, index + 1),
      copy,
      ...questions.slice(index + 1),
    ]);
    setActiveId(copy.id);
  };

  const handleDelete = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id));
  };

  return (
    <div className="mx-auto mt-10 flex w-full max-w-[851px] flex-col">
      <div className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            isActive={question.id === activeId}
            onActivate={() => setActiveId(question.id)}
            onChange={(patch) => updateQuestion(question.id, patch)}
            onDuplicate={() => handleDuplicate(index)}
            onDelete={() => handleDelete(question.id)}
          />
        ))}
      </div>

      {/* 항목 추가 */}
      <button
        type="button"
        aria-label="항목 추가"
        onClick={handleAdd}
        className="mx-auto mt-6 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-green-80 text-white shadow-sm transition-opacity lg:hover:opacity-90"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
