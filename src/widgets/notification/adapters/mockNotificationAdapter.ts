import type { AppNotification, NotificationAdapter } from '../types';

/** 분 단위 오프셋으로 mock createdAt 생성 */
const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

/** 세션 내 mock 알림 (읽음/보관 상태는 메모리에서만 유지) */
let mockNotifications: AppNotification[] = [
  {
    id: 'noti-1',
    type: 'SESSION',
    title: '축어록 풀이 완료',
    body: '김성곤_2회기.mp3 상담 기록의 축어록 풀이가 완료되었어요.',
    resourceType: 'SESSION',
    resourceId: '00000000-0000-0000-0000-000000000001',
    createdAt: minutesAgo(12),
    read: false,
  },
  {
    id: 'noti-2',
    type: 'CALENDAR',
    title: '오늘 상담 일정',
    body: '홍길동 내담자의 상담 일정이 있어요.',
    resourceType: 'CALENDAR_EVENT',
    resourceId: '00000000-0000-0000-0000-000000000002',
    createdAt: minutesAgo(120),
    read: true,
  },
  {
    id: 'noti-3',
    type: 'SESSION',
    title: '축어록 풀이 완료',
    body: '김성곤_1회기.mp3 상담 기록의 축어록 풀이가 완료되었어요.',
    resourceType: 'SESSION',
    resourceId: '00000000-0000-0000-0000-000000000003',
    createdAt: minutesAgo(60 * 26),
    read: true,
  },
  {
    id: 'noti-4',
    type: 'SYSTEM',
    title: '시스템 안내',
    body: '홍길동_3회기.mp3 상담 기록의 축어록 풀이가 완료되었어요.',
    resourceType: null,
    resourceId: null,
    createdAt: minutesAgo(60 * 24 * 3),
    read: true,
  },
];

/**
 * 인메모리 mock 어댑터 — 백엔드 연결 전 UI 확인용.
 * 읽음/보관 처리는 메모리에만 반영되므로 새로고침 시 초기화된다.
 */
export const mockNotificationAdapter: NotificationAdapter = {
  async list() {
    const notifications = [...mockNotifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  },

  // 읽음 처리는 불변 업데이트로 — 새 객체 참조를 만들어야 react-query가
  // 변경을 감지(structural sharing)하고 벨(unreadCount)을 리렌더한다.
  // in-place 변경 시 이전 캐시도 같은 참조라 "변경 없음"으로 보여 점이 안 사라짐.
  async markRead(id) {
    mockNotifications = mockNotifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
  },

  async markAllRead() {
    mockNotifications = mockNotifications.map((n) =>
      n.read ? n : { ...n, read: true }
    );
  },

  async archive(id) {
    mockNotifications = mockNotifications.filter((n) => n.id !== id);
  },
};
