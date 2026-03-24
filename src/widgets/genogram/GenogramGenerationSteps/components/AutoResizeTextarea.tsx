import { useRef, useEffect } from 'react';

import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Auto-resize Textarea 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export function AutoResizeTextarea({
  value,
  onChange,
  minRows = 2,
  maxRows = 6,
  className,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 높이 초기화 후 scrollHeight로 설정
    textarea.style.height = 'auto';
    const lineHeight = 20; // 대략적인 line-height
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    textarea.style.height = `${newHeight}px`;
  }, [value, minRows, maxRows]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={cn(
        'typo-sm resize-none rounded-md bg-primary-subtle px-2 py-2 text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        className
      )}
      {...props}
    />
  );
}
