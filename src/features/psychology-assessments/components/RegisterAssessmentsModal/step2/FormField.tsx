import { cn } from '@/lib/cn';

interface FormFieldProps {
  label: string;
  helperText?: string;
  required?: boolean;
  /** 검증 완료 시 우측 체크 표시 */
  validated?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  helperText,
  required,
  validated,
  children,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-emphasize text-grey-100">
        {label}
        {required && <span className="text-[#EF4444]">*</span>}
      </label>
      {helperText && <p className="text-xs text-grey-60">{helperText}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        {validated && (
          <span
            aria-hidden
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white"
          >
            ✓
          </span>
        )}
      </div>
    </div>
  );
};
