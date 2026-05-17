import { cn } from '@/lib/cn';

import { MAX_FILES } from '../types';

interface FileCountIndicatorProps {
  count: number;
  max?: number;
  className?: string;
}

export const FileCountIndicator = ({
  count,
  max = MAX_FILES,
  className,
}: FileCountIndicatorProps) => {
  return (
    <p className={cn('text-center text-sm font-sub text-grey-80', className)}>
      파일 개수 {count} / {max}
    </p>
  );
};
