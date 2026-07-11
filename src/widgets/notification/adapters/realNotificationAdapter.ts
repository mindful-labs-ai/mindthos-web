import { serverRequest } from '@/shared/api/server/serverClient';

import type { AppNotification, NotificationAdapter } from '../types';

/**
 * mindthos-server 실제 알림 API 어댑터.
 *
 * 서버 계약:
 *  - GET  /notifications?cursor=&limit=  → { notification, unreadCount }
 *  - PATCH /notifications/:id/read
 *  - POST  /notifications/read-all
 *  - PATCH /notifications/:id/archive
 *
 * serverRequest가 `/v1` prefix·Bearer·envelope(data) 처리를 담당하므로
 * 여기서는 path와 DTO→UI 모델 매핑만 신경 쓴다.
 */

const NOTIFICATION_ROUTES = {
  list: '/notifications',
  read: (id: string) => `/notifications/${id}/read`,
  readAll: '/notifications/read-all',
  archive: (id: string) => `/notifications/${id}/archive`,
} as const;

/** 서버 NotificationDto (data.notification[] 원소) */
interface NotificationDto {
  id: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  resourceType: AppNotification['resourceType'];
  resourceId: string | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

/** GET /notifications 응답 data */
interface ListNotificationsResponse {
  notification: NotificationDto[];
  unreadCount: number;
}

/** DTO → UI 모델 (read는 readAt에서 파생) */
function toAppNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    body: dto.body,
    resourceType: dto.resourceType,
    resourceId: dto.resourceId,
    createdAt: dto.createdAt,
    read: dto.readAt !== null,
  };
}

export const realNotificationAdapter: NotificationAdapter = {
  async list(params) {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();

    const data = await serverRequest<ListNotificationsResponse>(
      qs ? `${NOTIFICATION_ROUTES.list}?${qs}` : NOTIFICATION_ROUTES.list
    );

    return {
      notifications: data.notification.map(toAppNotification),
      unreadCount: data.unreadCount,
    };
  },

  async markRead(id) {
    await serverRequest<void>(NOTIFICATION_ROUTES.read(id), {
      method: 'PATCH',
    });
  },

  async markAllRead() {
    await serverRequest<void>(NOTIFICATION_ROUTES.readAll, {
      method: 'POST',
    });
  },

  async archive(id) {
    await serverRequest<void>(NOTIFICATION_ROUTES.archive(id), {
      method: 'PATCH',
    });
  },
};
