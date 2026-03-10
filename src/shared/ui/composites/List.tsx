import React from 'react';

import { cn } from '@/lib/cn';

export interface ListProps {
  items: React.ReactNode[];
  ordered?: boolean;
  className?: string;
}

/**
 * List - 리스트 컴포넌트
 * ordered prop으로 순서 있는/없는 리스트 전환
 * 최소한의 스타일 적용
 *
 * @example
 * <List ordered items={['첫 번째', '두 번째', '세 번째']} />
 */
export const List: React.FC<ListProps> = ({
  items,
  ordered = false,
  className,
}) => {
  const Component = ordered ? 'ol' : 'ul';

  return (
    <Component
      className={cn(
        'space-y-2',
        ordered ? 'list-inside list-decimal' : 'list-inside list-disc',
        'text-fg',
        className
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="text-sm">
          {item}
        </li>
      ))}
    </Component>
  );
};

List.displayName = 'List';
