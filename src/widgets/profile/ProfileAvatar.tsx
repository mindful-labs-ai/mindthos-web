import React from 'react';

import { cn } from '@/lib/cn';
import { ProgressCircle } from '@/shared/ui/atoms/ProgressCircle';

interface ProfileAvatarProps {
  /** 가운데 표시할 이니셜 */
  initial: string;
  /** 크레딧 잔여 퍼센트(0-100). 링 진행도로 사용 */
  percentage?: number;
  /** 전체 지름(px) */
  size?: number;
  className?: string;
}

/**
 * ProfileAvatar - 헤더 프로필 트리거용 아바타
 * 바깥쪽 크레딧 진행 링(ProgressCircle) + 가운데 사용자 이니셜
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  initial,
  percentage = 0,
  size = 40,
  className,
}) => {
  const innerSize = size - 12;

  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size }}
    >
      <ProgressCircle
        value={percentage}
        size={size}
        strokeWidth={4}
        showValue={false}
      />
      <span
        className="absolute inline-flex items-center justify-center rounded-full border border-grey-30 bg-grey-20 font-medium text-grey-100"
        style={{
          width: innerSize,
          height: innerSize,
          fontSize: Math.round(innerSize * 0.5),
        }}
      >
        {initial}
      </span>
    </span>
  );
};

ProfileAvatar.displayName = 'ProfileAvatar';
