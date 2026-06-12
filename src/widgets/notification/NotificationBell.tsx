import { useState } from 'react';

import { Bell } from 'lucide-react';

import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from './useNotifications';

/**
 * 헤더 우측 알림 벨 — 안 읽은 알림이 있으면 빨간 점 표시,
 * 클릭 시 우측 알림 패널 토글.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <button
        type="button"
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개 안 읽음` : '알림'}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-grey-70 transition-colors lg:hover:bg-grey-20 lg:hover:text-grey-100"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#D54036]" />
        )}
      </button>

      <NotificationPanel open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
