import { cn } from '@/lib/cn';

import { FieldDescription } from './FieldDescription';
import { FieldLabel } from './FieldLabel';

interface FieldRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** 라벨(+선택 설명) + 입력 영역 한 행 wrapper */
export const FieldRow = ({
  label,
  description,
  children,
  className,
}: FieldRowProps) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <FieldLabel>{label}</FieldLabel>
    {description && <FieldDescription>{description}</FieldDescription>}
    <div>{children}</div>
  </div>
);
