/**
 * 알림 종류(서버 NotificationType 8종) — 행 아이콘 매핑에 사용.
 * 서버 enum과 1:1 대응(@/entity notification-type.enum).
 */
export type NotificationKind =
  | 'SESSION'
  | 'PROGRESS_NOTE'
  | 'AI_SUPERVISION'
  | 'GENOGRAM'
  | 'CALENDAR'
  | 'DOCUMENT'
  | 'PAYMENT'
  | 'SYSTEM';

/**
 * 딥링크 대상 종류(서버 ResourceType) — 없으면 null.
 * PAYMENT/SYSTEM 등은 딥링크 대상이 없을 수 있다.
 */
export type NotificationDeepLinkResourceType =
  | 'SESSION'
  | 'PROGRESS_NOTE'
  | 'AI_SUPERVISION'
  | 'GENOGRAM'
  | 'CALENDAR_EVENT'
  | 'SENT_DOCUMENT';

/**
 * 알림 UI 모델.
 * 백엔드 응답이 어떤 형태든 어댑터가 이 모델로 변환해 UI는 동일하게 렌더한다.
 */
export interface AppNotification {
  id: string;
  /** 알림 종류(행 아이콘 매핑) */
  type: NotificationKind;
  /** 강조줄 */
  title: string;
  /** 본문 */
  body: string;
  /** 딥링크 대상 종류(없으면 null) */
  resourceType: NotificationDeepLinkResourceType | null;
  /** 딥링크 대상 id(없으면 null) */
  resourceId: string | null;
  /** ISO 문자열 */
  createdAt: string;
  /** readAt에서 파생 (null = 안 읽음) */
  read: boolean;
}

/** 어댑터 list() 응답 — 목록은 페이지네이션, unreadCount는 서버 집계값 */
export interface NotificationListResult {
  notifications: AppNotification[];
  /** 서버가 집계한 전체 안 읽음 수(페이지 .filter로 계산하지 말 것) */
  unreadCount: number;
}

/**
 * 알림 데이터 소스 어댑터.
 * 백엔드(REST/Supabase/실시간 등)가 정해지면 이 인터페이스 구현체만 교체한다.
 */
export interface NotificationAdapter {
  /** 알림 목록 + 안 읽음 수 조회 (최신순, archived 제외) */
  list(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<NotificationListResult>;
  /** 단건 읽음 처리 */
  markRead(id: string): Promise<void>;
  /** 전체 읽음 처리 */
  markAllRead(): Promise<void>;
  /** 단건 보관 처리 */
  archive(id: string): Promise<void>;
}
