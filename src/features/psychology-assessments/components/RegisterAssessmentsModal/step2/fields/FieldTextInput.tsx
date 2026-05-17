import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

type FieldTextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * 검증 폼 input — 통일된 스타일.
 * border 1px grey-40 / bg-grey-10 / placeholder grey-80 / font-sub text-grey-100 / h 35px
 */
export const FieldTextInput = forwardRef<HTMLInputElement, FieldTextInputProps>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-[35px] w-full rounded-md border border-grey-40 bg-grey-10 px-3 font-sub text-grey-100 placeholder:text-grey-80 focus:border-grey-80 focus:outline-none',
        className
      )}
      {...rest}
    />
  )
);

FieldTextInput.displayName = 'FieldTextInput';
