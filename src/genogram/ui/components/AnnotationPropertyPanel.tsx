import React, { useCallback } from 'react';

import type {
  Annotation,
  AnnotationUpdate,
} from '@/genogram/core/models/text-annotation';

import { ColorPicker } from './common/ColorPicker';

interface AnnotationPropertyPanelProps {
  annotation: Annotation;
  onUpdate: (annotationId: string, updates: AnnotationUpdate) => void;
}

export const AnnotationPropertyPanel: React.FC<
  AnnotationPropertyPanelProps
> = ({ annotation, onUpdate }) => {
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(annotation.id, { text: e.target.value });
    },
    [annotation.id, onUpdate]
  );

  const handleStyleChange = useCallback(
    (field: 'bgColor' | 'borderColor' | 'textColor', value: string) => {
      onUpdate(annotation.id, {
        layout: {
          ...annotation.layout,
          style: {
            ...annotation.layout.style,
            [field]: value,
          },
        },
      });
    },
    [annotation, onUpdate]
  );

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-80 overflow-y-auto border-l border-border bg-white shadow-lg">
      {/* 헤더 */}
      <div className="px-5 pt-5">
        <h2 className="text-lg font-bold text-fg">텍스트</h2>
      </div>

      <hr className="mx-5 mt-3 border-border" />

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* 내용 */}
        <section>
          <h3 className="mb-2 text-base font-medium text-fg">내용</h3>
          <textarea
            value={annotation.text}
            onChange={handleTextChange}
            placeholder="메모를 추가하세요."
            rows={5}
            className="w-full resize-none rounded-md border-2 border-border bg-surface p-3 text-sm outline-none transition-colors placeholder:text-fg-muted"
          />
        </section>

        <hr className="border-border" />

        {/* 배경 색상 */}
        <section className="flex items-center justify-between">
          <h3 className="text-base font-medium text-fg">배경 색상</h3>
          <ColorPicker
            value={annotation.layout.style.bgColor}
            onChange={(v) => handleStyleChange('bgColor', v)}
          />
        </section>

        {/* 선 색상 */}
        <section className="flex items-center justify-between">
          <h3 className="text-base font-medium text-fg">선 색상</h3>
          <ColorPicker
            value={annotation.layout.style.borderColor}
            onChange={(v) => handleStyleChange('borderColor', v)}
          />
        </section>

        {/* 텍스트 색상 */}
        <section className="flex items-center justify-between">
          <h3 className="text-base font-medium text-fg">텍스트 색상</h3>
          <ColorPicker
            value={annotation.layout.style.textColor}
            onChange={(v) => handleStyleChange('textColor', v)}
          />
        </section>
      </div>
    </div>
  );
};
