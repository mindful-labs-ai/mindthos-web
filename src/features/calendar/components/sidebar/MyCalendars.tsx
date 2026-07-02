import { Plus } from 'lucide-react';

import type { CalendarCategory, CalendarColorKey } from '../../types';

import { CategorySettingsMenu } from './CategorySettingsMenu';
import { CategoryToggleItem } from './CategoryToggleItem';

interface MyCalendarsProps {
  categories: CalendarCategory[];
  categoryVisible: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  /** 헤더 + 버튼 — 구글 캘린더 연결하기 사이드탭(캘린더 추가하기 패널) 열기. */
  onConnect?: () => void;
  /** 연동 해제(설정 메뉴) — 카테고리와 소속(연동) 일정 함께 삭제. */
  onDeleteCategory?: (categoryId: string) => void;
}

/** provider별 표시 색 — 서버 import 기본색과 일치(구글=파랑, 그 외=회색). */
const PROVIDER_COLOR: Record<string, CalendarColorKey> = {
  google: 'blue',
  naver: 'grey',
  apple: 'grey',
};

/** provider별 표시 이름. */
const PROVIDER_LABEL: Record<string, string> = {
  google: '구글 캘린더',
  naver: '네이버 캘린더',
  apple: '애플 캘린더',
};

function calendarLabel(category: CalendarCategory): string {
  return PROVIDER_LABEL[category.sourceProvider ?? ''] ?? category.name;
}

/**
 * '나의 캘린더' — 연동된 외부 캘린더(구글 등) 목록.
 * 카테고리는 외부 캘린더 연동 전용 도메인이라(일정에서 직접 지정 불가), 여기서 표시 on/off만 한다.
 * 색 스와치는 provider 기본색(구글=파랑)으로 서버 import 색과 맞춘다. 헤더 + 버튼으로 연결 사이드탭을 연다.
 */
export function MyCalendars({
  categories,
  categoryVisible,
  onToggleCategory,
  onConnect,
  onDeleteCategory,
}: MyCalendarsProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-m font-medium text-grey-100">나의 캘린더</h3>
        {onConnect && (
          <button
            type="button"
            aria-label="구글 캘린더 연결하기"
            onClick={onConnect}
            className="flex h-6 w-6 items-center justify-center text-grey-100 lg:hover:text-grey-80"
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <CategoryToggleItem
                  label={calendarLabel(category)}
                  colorKey={PROVIDER_COLOR[category.sourceProvider ?? '']}
                  checked={categoryVisible[category.id] ?? true}
                  onToggle={() => onToggleCategory(category.id)}
                />
              </div>
              {onDeleteCategory && (
                <CategorySettingsMenu
                  categoryName={calendarLabel(category)}
                  onDelete={() => onDeleteCategory(category.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
