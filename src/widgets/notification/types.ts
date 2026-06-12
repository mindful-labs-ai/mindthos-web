/** 알림 종류 — 행 아이콘 매핑에 사용 */
export type NotificationKind = 'session' | 'calendar' | 'system';

/**
 * 알림 UI 모델.
 * 백엔드 응답이 어떤 형태든 어댑터가 이 모델로 변환해 UI는 동일하게 렌더한다.
 */
export interface AppNotification {
  id: string;
  kind: NotificationKind;
  message: string;
  /** ISO 문자열 */
  createdAt: string;
  read: boolean;
}

/**
 * 알림 데이터 소스 어댑터.
 * 백엔드(REST/Supabase/실시간 등)가 정해지면 이 인터페이스 구현체만 교체한다.
 */
export interface NotificationAdapter {
  /** 알림 목록 조회 (최신순) */
  list(): Promise<AppNotification[]>;
  /** 단건 읽음 처리 */
  markRead(id: string): Promise<void>;
  /** 전체 읽음 처리 */
  markAllRead(): Promise<void>;
}
