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
  createField,
  duplicateField,
  isValidField,
} from '../../constants/formField';
import type { FormField, FormFieldType } from '../../types';

import { FieldCard } from './FieldCard';

interface QnaEditorProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  /** 필수 미충족 저장 시도 후 하이라이트 — 유효하지 않은 필드에 빨간 보더 표시 */
  showInvalid?: boolean;
}

/** 라벨/제목 텍스트를 유형 전환 시 보존하기 위해 읽는다(없으면 ''). */
function fieldText(field: FormField): string {
  if (field.type === 'section') return field.title;
  if (field.type === 'richtext') return '';
  return field.label;
}

/**
 * 양식 필드 에디터 — 필드 카드 목록 + 하단 + 버튼으로 추가.
 * 항목이 없으면 빈 캔버스 (저장 비활성 조건은 컨테이너에서 처리).
 */
export function QnaEditor({
  fields,
  onFieldsChange,
  showInvalid = false,
}: QnaEditorProps) {
  // 활성(편집 중) 항목 — 초록 보더 표시
  const [activeKey, setActiveKey] = useState<string | null>(
    fields[0]?.key ?? null
  );

  // 완성된 필드로 교체 — FieldBody의 변형별 에디터가 타입 안전하게 구성해 넘긴다(캐스팅 없음).
  const replaceField = (key: string, updated: FormField) => {
    onFieldsChange(
      fields.map((field) => (field.key === key ? updated : field))
    );
  };

  // 유형 변경 — 새 유형 기본 필드로 재구성하되 key·라벨/제목은 보존(판별자 변경은 속성 패치와 별개).
  const changeFieldType = (key: string, type: FormFieldType) => {
    onFieldsChange(
      fields.map((field) => {
        if (field.key !== key || field.type === type) return field;
        const rebuilt = createField(type);
        rebuilt.key = field.key;
        const text = fieldText(field);
        if (text) {
          if (rebuilt.type === 'section') rebuilt.title = text;
          else if (rebuilt.type !== 'richtext') rebuilt.label = text;
        }
        return rebuilt;
      })
    );
  };

  const handleAdd = () => {
    const field = createField();
    onFieldsChange([...fields, field]);
    setActiveKey(field.key);
  };

  const handleDuplicate = (index: number) => {
    const copy = duplicateField(fields[index]);
    onFieldsChange([
      ...fields.slice(0, index + 1),
      copy,
      ...fields.slice(index + 1),
    ]);
    setActiveKey(copy.key);
  };

  const handleDelete = (key: string) => {
    onFieldsChange(fields.filter((field) => field.key !== key));
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
    const oldIndex = fields.findIndex((f) => f.key === active.id);
    const newIndex = fields.findIndex((f) => f.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onFieldsChange(arrayMove(fields, oldIndex, newIndex));
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
          items={fields.map((f) => f.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {fields.map((field, index) => (
              <FieldCard
                key={field.key}
                field={field}
                isActive={field.key === activeKey}
                invalid={showInvalid && !isValidField(field)}
                onActivate={() => setActiveKey(field.key)}
                onChange={(updated) => replaceField(field.key, updated)}
                onTypeChange={(type) => changeFieldType(field.key, type)}
                onDuplicate={() => handleDuplicate(index)}
                onDelete={() => handleDelete(field.key)}
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
        className="mx-auto mt-6 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-green-80 text-white shadow-subtle transition-opacity lg:hover:opacity-90"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
