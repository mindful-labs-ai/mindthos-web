import { useLayoutEffect, useRef } from 'react';

import { cn } from '@/lib/cn';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * 고정 구조 보고서 편집용 자동 높이 textarea.
 * 표시 텍스트와 동일한 타이포를 유지하고, 편집 가능 영역임을 테두리로 표시.
 */
export function EditableText({
  value,
  onChange,
  className,
  ariaLabel,
}: EditableTextProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // 내용에 맞춰 높이 자동 조절
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      rows={1}
      className={cn(
        'block w-full resize-none overflow-hidden rounded-md border border-grey-30 bg-white px-2 py-1',
        'text-m leading-relaxed text-fg focus:border-green-80 focus:outline-none',
        className
      )}
    />
  );
}
