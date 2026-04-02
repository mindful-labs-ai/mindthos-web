import React, { useCallback, useEffect, useRef } from 'react';

import { FONT_SIZE_ANNOTATION } from '@/genogram/core/constants/typography';
import type {
  Annotation,
  AnnotationUpdate,
} from '@/genogram/core/models/text-annotation';

import { ColorPicker } from './common/ColorPicker';
import { InlineDropdown } from './common/InlineDropdown';

const FONT_SIZE_OPTIONS = [
  { label: '매우 작게', value: '14' },
  { label: '작게', value: '18' },
  { label: '기본', value: String(FONT_SIZE_ANNOTATION) },
  { label: '크게', value: '28' },
  { label: '매우 크게', value: '36' },
];

interface AnnotationPropertyPanelProps {
  annotation: Annotation;
  onUpdate: (annotationId: string, updates: AnnotationUpdate) => void;
}

export const AnnotationPropertyPanel: React.FC<
  AnnotationPropertyPanelProps
> = ({ annotation, onUpdate }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [annotation.id]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(annotation.id, { text: e.target.value });
    },
    [annotation.id, onUpdate]
  );

  const handleFontSizeChange = useCallback(
    (value: number) => {
      onUpdate(annotation.id, {
        layout: {
          ...annotation.layout,
          style: {
            ...annotation.layout.style,
            fontSize: value,
          },
        },
      });
    },
    [annotation, onUpdate]
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
    <div className="absolute right-0 top-0 z-10 h-full w-80 overflow-y-auto border-l border-grey-40 bg-white shadow-lg">
      {/* 헤더 */}
      <div className="px-5 pt-5">
        <h2 className="text-lg font-bold text-grey-100">텍스트</h2>
      </div>

      <hr className="mx-5 mt-3 border-grey-40" />

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* 내용 */}
        <section>
          <h3 className="mb-2 text-base font-medium text-grey-100">내용</h3>
          <textarea
            ref={textareaRef}
            value={annotation.text}
            onChange={handleTextChange}
            placeholder="메모를 추가하세요."
            rows={5}
            className="w-full resize-none rounded-md border-2 border-grey-40 bg-white p-3 text-sm outline-none transition-colors placeholder:text-grey-70"
          />
        </section>

        {/* 글씨 크기 */}
        <section className="flex items-center justify-between">
          <h3 className="text-base font-medium text-grey-100">글씨 크기</h3>
          <InlineDropdown
            items={FONT_SIZE_OPTIONS}
            value={String(
              annotation.layout.style.fontSize ?? FONT_SIZE_ANNOTATION
            )}
            onChange={(v) => handleFontSizeChange(Number(v))}
          />
        </section>

        <hr className="border-grey-40" />

        {/* 배경 색상 */}
        <section className="flex items-center justify-between">
          <h3 className="text-base font-medium text-grey-100">배경 색상</h3>
          <ColorPicker
            value={annotation.layout.style.bgColor}
            onChange={(v) => handleStyleChange('bgColor', v)}
          />
        </section>

        {/* 선 색상 */}
        <section className="flex items-center justify-between">
          <h3 className="text-base font-medium text-grey-100">선 색상</h3>
          <ColorPicker
            value={annotation.layout.style.borderColor}
            onChange={(v) => handleStyleChange('borderColor', v)}
          />
        </section>

        {/* 텍스트 색상 */}
        <section className="flex items-center justify-between">
          <h3 className="text-base font-medium text-grey-100">텍스트 색상</h3>
          <ColorPicker
            value={annotation.layout.style.textColor}
            onChange={(v) => handleStyleChange('textColor', v)}
          />
        </section>
      </div>
    </div>
  );
};
