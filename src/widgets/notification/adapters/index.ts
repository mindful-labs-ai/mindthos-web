import type { NotificationAdapter } from '../types';

import { mockNotificationAdapter } from './mockNotificationAdapter';
import { realNotificationAdapter } from './realNotificationAdapter';

/**
 * 알림 데이터 소스 단일 스왑 포인트.
 *
 * 기본은 실제 mindthos-server 어댑터.
 * 백엔드 없이 UI를 확인하려면 VITE_USE_MOCK_NOTIFICATIONS=true 로 mock 사용.
 * (UI·훅은 NotificationAdapter 인터페이스만 의존)
 */
const useMock = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true';

export const notificationAdapter: NotificationAdapter = useMock
  ? mockNotificationAdapter
  : realNotificationAdapter;
