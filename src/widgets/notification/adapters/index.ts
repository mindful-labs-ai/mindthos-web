import type { NotificationAdapter } from '../types';

import { mockNotificationAdapter } from './mockNotificationAdapter';

/**
 * 알림 데이터 소스 단일 스왑 포인트.
 * 백엔드가 정해지면 이 한 줄만 실제 어댑터 구현체로 교체한다
 * (UI·훅은 NotificationAdapter 인터페이스만 의존).
 */
export const notificationAdapter: NotificationAdapter = mockNotificationAdapter;
