import { ChevronLeft, Plus } from 'lucide-react';

import type { CalendarProvider } from '../../adapters';
import { PROVIDER_ICONS } from '../../icons';

interface AddCalendarPanelProps {
  onClose: () => void;
  /** 후속 Phase: provider별 import 어댑터 연결 */
  onConnect?: (provider: CalendarProvider) => void;
}

const PROVIDERS: { provider: CalendarProvider; name: string }[] = [
  { provider: 'google', name: '구글 캘린더' },
  { provider: 'naver', name: '네이버 캘린더' },
  { provider: 'apple', name: '애플 캘린더' },
];

/**
 * 캘린더 추가하기 슬라이드오버 패널 — 외부 캘린더(구글/네이버/애플) 연결.
 * provider 아이콘은 `features/calendar/icons`의 PROVIDER_ICONS에서 교체.
 * 연결 동작은 후속 Phase(import 어댑터).
 */
export function AddCalendarPanel({ onClose, onConnect }: AddCalendarPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-7">
        <button
          type="button"
          aria-label="뒤로"
          onClick={onClose}
          className="text-[#8b8c93]"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h2 className="text-sm font-emphasize text-[#222121]">캘린더 추가하기</h2>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-3">
        {PROVIDERS.map((p) => {
          const Icon = PROVIDER_ICONS[p.provider];
          return (
            <div
              key={p.provider}
              className="flex flex-col items-center gap-3 rounded-md border border-grey-40 bg-grey-10 px-5 pb-5 pt-5"
            >
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-md border border-grey-40 bg-white">
                <Icon />
              </div>
              <span className="text-sm font-headline text-grey-100">
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => onConnect?.(p.provider)}
                className="flex items-center gap-1.5 rounded-md border border-grey-40 bg-white px-[19px] py-1.5 text-sm font-headline text-grey-100"
              >
                <Plus size={12} strokeWidth={3} />
                연결하기
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
