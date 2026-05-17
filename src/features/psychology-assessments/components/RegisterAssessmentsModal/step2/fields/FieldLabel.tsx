import { cn } from '@/lib/cn';

interface FieldLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

/** 스키마 라벨 (e.g. '이름', 'F(P) | Infrequency-Psychopathology') */
export const FieldLabel = ({
  children,
  htmlFor,
  className,
}: FieldLabelProps) => (
  <label
    htmlFor={htmlFor}
    className={cn('text-sm font-medium text-grey-100', className)}
  >
    {children}
  </label>
);
