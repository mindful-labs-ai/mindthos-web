import React from 'react';

import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

import { ConnectCalendarIcon } from '../../icons';

interface GoogleConnectCardProps {
  /** 구글 캘린더 연동 트리거 (연동 팝업 오픈) */
  onConnect?: () => void;
  /** 이미 연동됨 — 비활성화(재연동은 '나의 캘린더'의 + 버튼으로) */
  disabled?: boolean;
}

/**
 * 외부 캘린더(구글) 연동 카드 — 사이드탭 하단.
 * 구글이 이미 연동돼 있으면 비활성화(회색)로 표시하고, 재연동은 '나의 캘린더' + 버튼에서 한다.
 * 아이콘은 `features/calendar/icons`의 ConnectCalendarIcon에서 교체.
 */
export function GoogleConnectCard({
  onConnect,
  disabled = false,
}: GoogleConnectCardProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center rounded-md border border-grey-40 bg-grey-10 px-4 pb-5 pt-5',
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 text-[#d9d9d9]"
      >
        <X size={24} />
      </button>

      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-md border border-grey-40 bg-white">
        <ConnectCalendarIcon />
      </div>

      <p className="mt-4 text-center text-sm font-medium leading-[24px] text-grey-100">
        {disabled
          ? '구글 캘린더가 연동되어 있어요.'
          : '구글 캘린더를 마음토스 캘린더에 연동해서 관리해보세요.'}
      </p>

      <button
        type="button"
        onClick={onConnect}
        disabled={disabled}
        className={cn(
          'mt-4 rounded-md border px-[19px] py-1.5 text-sm font-headline',
          disabled
            ? 'cursor-not-allowed border-grey-40 bg-grey-20 text-grey-60'
            : 'border-grey-40 bg-white text-grey-100'
        )}
      >
        {disabled ? '연동됨' : '캘린더 연결하기'}
      </button>
    </div>
  );
}
