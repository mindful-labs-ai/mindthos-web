import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

type FieldTextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** 검증 폼 textarea — input과 동일 톤, height만 가변 */
export const FieldTextArea = forwardRef<
  HTMLTextAreaElement,
  FieldTextAreaProps
>(({ className, rows = 3, ...rest }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      'w-full resize-none rounded-md border border-grey-40 bg-grey-10 px-3 py-2 font-sub text-grey-100 placeholder:text-grey-80 focus:border-grey-80 focus:outline-none',
      className
    )}
    {...rest}
  />
));

FieldTextArea.displayName = 'FieldTextArea';
