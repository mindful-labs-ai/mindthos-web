import { Fragment, useEffect, useState } from 'react';

import { Bell, ChevronRight } from 'lucide-react';

import { SideCalendarIcon, SideSessionIcon } from '@/shared/icons';

import type { AppNotification, NotificationKind } from './types';
import { formatRelativeTime, useNotifications } from './useNotifications';

type NotificationFilter = 'all' | 'unread';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

/** 알림 종류별 행 아이콘 */
function KindIcon({ kind }: { kind: NotificationKind }) {
  const className = 'flex-shrink-0 text-[#BABCC7]';
  switch (kind) {
    case 'session':
      return <SideSessionIcon size={24} className={className} />;
    case 'calendar':
      return <SideCalendarIcon size={24} className={className} />;
    default:
      return <Bell size={24} className={className} />;
  }
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[35px] w-[68px] items-center justify-center rounded-lg border px-2.5 text-m font-medium transition-colors ${
        active
          ? 'border-green-80 bg-[#FDFFFE] text-green-80'
          : 'border-[#ECEDF3] bg-white text-[#ABAEBE] lg:hover:text-grey-80'
      }`}
    >
      {label}
    </button>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRead(notification.id)}
      className="block w-full px-5 py-6 text-left transition-colors lg:hover:bg-grey-10"
    >
      <div className="flex gap-3">
        <KindIcon kind={notification.kind} />
        <div className="min-w-0 flex-1">
          <p className="break-keep text-m font-medium leading-snug text-grey-100">
            {notification.message}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm font-medium text-[#BABCC7]">
            <span>{formatRelativeTime(notification.createdAt)}</span>
            {!notification.read && <span>안 읽음</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * 헤더 벨 클릭 시 우측에서 열리는 알림 패널.
 * 데이터는 NotificationAdapter 추상화 위에서 렌더 — 백엔드가 무엇이든 UI 동일.
 */
export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, isLoading, markRead, markAllRead } =
    useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>('all');

  // 슬라이드 인/아웃 — isVisible은 애니메이션 상태, 닫힐 때는 끝난 뒤 언마운트
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // 마운트 직후 translate-x-full이 먼저 그려진 뒤 슬라이드 인
      const frame = requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsVisible(true))
      );
      return () => cancelAnimationFrame(frame);
    }
    // 슬라이드 아웃이 끝난 뒤 언마운트
    const timer = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open && !isVisible) return null;

  const filtered =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <>
      {/* 바깥 클릭 닫기용 투명 오버레이 (닫힘 애니메이션 중에는 제거) */}
      {open && (
        <div
          className="fixed inset-0 z-modal"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="알림"
        className={`fixed bottom-0 right-0 top-[var(--height-header)] z-modal flex w-[480px] max-w-full flex-col bg-white shadow-[-10px_-10px_40px_rgba(60,60,60,0.15)] transition-transform duration-300 ease-out ${
          open && isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 상단: 접기 + 필터 + 모두 읽기 */}
        <div className="pr- flex h-[66px] flex-shrink-0 items-center gap-3 px-6 pt-6">
          <button
            type="button"
            aria-label="알림 패널 닫기"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[#8B8C93] transition-colors lg:hover:bg-grey-20"
          >
            <ChevronRight size={24} />
          </button>
          <div className="flex items-center gap-2">
            <FilterChip
              label="전체"
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <FilterChip
              label="안 읽음"
              active={filter === 'unread'}
              onClick={() => setFilter('unread')}
            />
          </div>
          <button
            type="button"
            onClick={() => markAllRead()}
            className="ml-auto h-[35px] w-[80px] text-m font-medium text-[#ABAEBE] transition-colors lg:hover:text-grey-80"
          >
            모두 읽기
          </button>
        </div>

        {/* 알림 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-grey-60">
              알림을 불러오는 중...
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-grey-60">
              {filter === 'unread'
                ? '안 읽은 알림이 없어요.'
                : '알림이 없어요.'}
            </p>
          ) : (
            filtered.map((notification, index) => (
              <Fragment key={notification.id}>
                {/* 항목 사이에만 구분선 */}
                {index > 0 && (
                  <div className="mx-4 border-b border-[#ECEDF3]" />
                )}
                <NotificationRow
                  notification={notification}
                  onRead={markRead}
                />
              </Fragment>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
