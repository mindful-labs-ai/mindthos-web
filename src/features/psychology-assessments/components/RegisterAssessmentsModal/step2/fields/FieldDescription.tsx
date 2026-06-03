import { cn } from '@/lib/cn';

interface FieldDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/** 스키마 라벨 아래 작은 설명문 */
export const FieldDescription = ({
  children,
  className,
}: FieldDescriptionProps) => (
  <p className={cn('text-xs font-medium text-grey-70', className)}>
    {children}
  </p>
);
