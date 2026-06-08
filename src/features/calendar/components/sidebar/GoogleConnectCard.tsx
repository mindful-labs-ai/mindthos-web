import React from 'react';

import { X } from 'lucide-react';

import { ConnectCalendarIcon } from '../../icons';

interface GoogleConnectCardProps {
  /** 후속 Phase: 구글 캘린더 연동 플로우 (provider별 import 어댑터) */
  onConnect?: () => void;
}

/**
 * 외부 캘린더(구글) 연동 카드 — 사이드탭 하단.
 * Phase 1은 정적 UI + 닫기. 연동 동작은 후속 Phase.
 * 아이콘은 `features/calendar/icons`의 ConnectCalendarIcon에서 교체.
 */
export function GoogleConnectCard({ onConnect }: GoogleConnectCardProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div className="relative flex flex-col items-center rounded-md border border-grey-40 bg-grey-10 px-4 pb-5 pt-5">
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
        구글 캘린더를 마음토스 캘린더에 연동해서 관리해보세요.
      </p>

      <button
        type="button"
        onClick={onConnect}
        className="mt-4 rounded-md border border-grey-40 bg-white px-[19px] py-1.5 text-sm font-headline text-grey-100"
      >
        캘린더 연결하기
      </button>
    </div>
  );
}
