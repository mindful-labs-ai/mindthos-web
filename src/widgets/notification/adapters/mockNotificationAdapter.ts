import type { AppNotification, NotificationAdapter } from '../types';

/** 분 단위 오프셋으로 mock createdAt 생성 */
const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

/** 세션 내 mock 알림 (읽음 상태는 메모리에서만 유지) */
const mockNotifications: AppNotification[] = [
  {
    id: 'noti-1',
    kind: 'session',
    message: '김성곤_2회기.mp3 상담 기록의 축어록 풀이가 완료되었어요.',
    createdAt: minutesAgo(12),
    read: false,
  },
  {
    id: 'noti-2',
    kind: 'calendar',
    message: '홍길동 내담자의 상담 일정이 있어요.',
    createdAt: minutesAgo(120),
    read: true,
  },
  {
    id: 'noti-3',
    kind: 'session',
    message: '김성곤_1회기.mp3 상담 기록의 축어록 풀이가 완료되었어요.',
    createdAt: minutesAgo(60 * 26),
    read: true,
  },
  {
    id: 'noti-4',
    kind: 'session',
    message: '홍길동_3회기.mp3 상담 기록의 축어록 풀이가 완료되었어요.',
    createdAt: minutesAgo(60 * 24 * 3),
    read: true,
  },
];

/**
 * 인메모리 mock 어댑터 — 백엔드 연결 전 UI 확인용.
 * 읽음 처리는 메모리에만 반영되므로 새로고침 시 초기화된다.
 */
export const mockNotificationAdapter: NotificationAdapter = {
  async list() {
    return [...mockNotifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async markRead(id) {
    const target = mockNotifications.find((n) => n.id === id);
    if (target) target.read = true;
  },

  async markAllRead() {
    mockNotifications.forEach((n) => {
      n.read = true;
    });
  },
};
