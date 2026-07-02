import { Fragment, useEffect, useState } from 'react';

import { Bell, ChevronRight } from 'lucide-react';

import {
  ROUTES,
  getClientDetailRoute,
  getSessionDetailRoute,
} from '@/app/router/constants';
import { serverRequest } from '@/shared/api/server/serverClient';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  CreditIcon,
  FileTextIcon,
  SideCalendarIcon,
  SideDocumentIcon,
  SideGenogramIcon,
  SideSessionIcon,
  SideSupervisionIcon,
} from '@/shared/icons';

import type { AppNotification, NotificationKind } from './types';
import { formatRelativeTime, useNotifications } from './useNotifications';

type NotificationFilter = 'all' | 'unread';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SentDocumentLinkDto {
  clientId: string;
}

/**
 * resourceType(+resourceId) → 앱 라우트 매핑.
 * 매핑 가능한 대상만 경로를 반환하고, 대상이 없으면(PAYMENT/SYSTEM 등) null.
 *
 * NOTE: SENT_DOCUMENT/GENOGRAM/AI_SUPERVISION/CALENDAR_EVENT/PROGRESS_NOTE는 현재
 * 리소스 id로 직접 진입하는 라우트가 없어 가장 가까운 목록/페이지로 보낸다.
 */
async function resolveDeepLink(
  notification: AppNotification
): Promise<string | null> {
  const { resourceType, resourceId } = notification;
  switch (resourceType) {
    case 'SESSION':
      return resourceId ? getSessionDetailRoute(resourceId) : ROUTES.SESSIONS;
    case 'SENT_DOCUMENT':
      if (!resourceId) return ROUTES.DOCUMENTS;
      try {
        const doc = await serverRequest<SentDocumentLinkDto>(
          `/sent-documents/${resourceId}`
        );
        return `${getClientDetailRoute(doc.clientId)}?tab=documents`;
      } catch {
        return ROUTES.DOCUMENTS;
      }
    case 'CALENDAR_EVENT':
      // TODO(deeplink): 개별 일정으로 진입하는 라우트가 생기면 resourceId로 연결.
      return ROUTES.CALENDAR;
    case 'AI_SUPERVISION':
      // TODO(deeplink): /ai-supervision은 clientId 기준이라 analysis id로 진입 불가.
      return ROUTES.AI_SUPERVISION;
    case 'GENOGRAM':
      // TODO(deeplink): /genogram은 clientId 기준이라 genogram id로 진입 불가.
      return ROUTES.GENOGRAM;
    case 'PROGRESS_NOTE':
      // TODO(deeplink): 경과기록 단건 라우트가 없어 세션 목록으로 보낸다.
      return ROUTES.SESSIONS;
    default:
      return null;
  }
}

/** 알림 종류(8종)별 행 아이콘 */
function KindIcon({ kind }: { kind: NotificationKind }) {
  const className = 'flex-shrink-0 text-grey-60';
  switch (kind) {
    case 'SESSION':
      return <SideSessionIcon size={24} className={className} />;
    case 'PROGRESS_NOTE':
      return <FileTextIcon size={24} className={className} />;
    case 'AI_SUPERVISION':
      return <SideSupervisionIcon size={24} className={className} />;
    case 'GENOGRAM':
      return <SideGenogramIcon size={24} className={className} />;
    case 'CALENDAR':
      return <SideCalendarIcon size={24} className={className} />;
    case 'DOCUMENT':
      return <SideDocumentIcon size={24} className={className} />;
    case 'PAYMENT':
      return <CreditIcon size={24} className={className} />;
    case 'SYSTEM':
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
          ? 'border-green-80 bg-green-10 text-green-80'
          : 'border-[#ECEDF3] bg-white text-[#ABAEBE] lg:hover:text-grey-80'
      }`}
    >
      {label}
    </button>
  );
}

function NotificationRow({
  notification,
  onClick,
  resolving = false,
}: {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void | Promise<void>;
  /** 딥링크 해석 진행 중 — 행 잠금 + 흐림 표시 */
  resolving?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={resolving}
      onClick={() => {
        void onClick(notification);
      }}
      className={`block w-full px-5 py-6 text-left transition-colors lg:hover:bg-grey-10 ${
        resolving ? 'opacity-60' : ''
      }`}
    >
      <div className="flex gap-3">
        <KindIcon kind={notification.type} />
        <div className="min-w-0 flex-1">
          {/* 강조줄(title) + 본문(body) 2줄 */}
          <p className="break-keep text-m font-semibold leading-snug text-grey-100">
            {notification.title}
          </p>
          <p className="mt-1 break-keep text-m font-medium leading-snug text-grey-70">
            {notification.body}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm font-medium text-grey-60">
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
  const { navigateWithUtm } = useNavigateWithUtm();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  // 딥링크 해석 중인 알림 id — 해석 동안 행 잠금(이중 클릭/이중 이동 방지)
  const [resolvingId, setResolvingId] = useState<string | null>(null);

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

  // 행 클릭: 읽음 처리 + 딥링크 이동(있으면 패널 닫고 이동).
  // resolveDeepLink await 동안 행을 잠가(이중 클릭 방지) 흐림으로 진행 중임을 보여준다.
  const handleRowClick = async (notification: AppNotification) => {
    if (resolvingId) return;
    if (!notification.read) {
      markRead(notification.id);
    }
    setResolvingId(notification.id);
    try {
      const path = await resolveDeepLink(notification);
      if (path) {
        onClose();
        navigateWithUtm(path);
      }
    } finally {
      setResolvingId(null);
    }
  };

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
        // 모바일(sm 미만)은 풀스크린(상태바/노치 회피 위해 safe-area 인셋),
        // 데스크탑은 헤더 아래 우측 패널
        className={`fixed bottom-0 right-0 top-0 z-modal flex w-full max-w-full flex-col bg-white pt-[env(safe-area-inset-top)] shadow-[-10px_-10px_40px_rgba(60,60,60,0.15)] transition-transform duration-300 ease-out sm:top-[var(--height-header)] sm:w-[480px] sm:pt-0 ${
          open && isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 상단: 접기 + 필터 + 모두 읽기 */}
        <div className="flex h-[66px] flex-shrink-0 items-center gap-3 px-6 pt-6">
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
                  onClick={handleRowClick}
                  resolving={resolvingId === notification.id}
                />
              </Fragment>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
