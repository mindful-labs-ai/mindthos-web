import React from 'react';

import { cn } from '@/lib/cn';

import { BackButton } from './BackButton';

export interface MobileModalHeaderProps {
  /** 제목 — 문자열 또는 커스텀 노드(이름+부제 등) */
  title?: React.ReactNode;
  /** 뒤로가기 — 없으면 BackButton 미표시 */
  onBack?: () => void;
  /** 우측 액션 슬롯 (있으면 제목과 사이를 벌린다) */
  right?: React.ReactNode;
  className?: string;
}

/**
 * 모바일 풀페이지(모달/슬라이드오버) 상단 고정 헤더.
 * 뒤로가기 + 제목이 공통이라 atom으로 추출 — 앱 전반의 h-[67px] 헤더를 통일한다.
 * 우측 액션이나 커스텀 제목 노드가 필요한 화면은 right/title(ReactNode)로 처리.
 */
export const MobileModalHeader: React.FC<MobileModalHeaderProps> = ({
  title,
  onBack,
  right,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 bg-white px-4',
        right && 'justify-between',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {onBack && <BackButton onClick={onBack} />}
        {typeof title === 'string' ? (
          <p className="truncate text-m font-medium text-grey-100">{title}</p>
        ) : (
          title
        )}
      </div>
      {right}
    </div>
  );
};
