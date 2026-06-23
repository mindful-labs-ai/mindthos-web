import { useState } from 'react';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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

  // 드래그로 항목 순서 변경 — 핸들에서만 시작(PointerSensor), 키보드 접근성(KeyboardSensor)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onQuestionsChange(arrayMove(questions, oldIndex, newIndex));
  };

  return (
    <div className="mx-auto mt-10 flex w-full max-w-[851px] flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
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
        </SortableContext>
      </DndContext>

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
