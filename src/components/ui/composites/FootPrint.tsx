import React from 'react';

import { cn } from '@/lib/cn';

export interface FootPrintItem {
  icon?: React.ReactNode;
  label: string;
  value?: string;
}

export interface FootPrintProps {
  items: FootPrintItem[];
  className?: string;
}

/**
 * FootPrint - 메타 정보 표시 컴포넌트
 * 작성자, 생성 시간 등 메타 정보 한 줄로 표시
 * icon, label, value 조합으로 구성
 *
 * @example
 * <FootPrint items={[{ icon: <UserIcon />, label: '작성자', value: '홍길동' }]} />
 */
export const FootPrint: React.FC<FootPrintProps> = ({ items, className }) => {
  return (
    <div
      className={cn('flex items-center gap-4 text-xs text-fg-muted', className)}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          <span>
            {item.label}
            {item.value && (
              <span className="ml-1 font-medium text-fg">{item.value}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

FootPrint.displayName = 'FootPrint';
