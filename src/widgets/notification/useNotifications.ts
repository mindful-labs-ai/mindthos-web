import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationAdapter } from './adapters';

const NOTIFICATION_QUERY_KEY = ['notifications'] as const;

/**
 * 알림 목록/읽음 처리 훅 — 어댑터를 react-query로 감싼다.
 * 백엔드 교체 시에도 이 훅과 UI는 그대로 유지된다.
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: () => notificationAdapter.list(),
    staleTime: 30 * 1000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationAdapter.markRead(id),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationAdapter.markAllRead(),
    onSuccess: invalidate,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}

/** "12분 전" 형태의 상대 시간 포맷 */
export function formatRelativeTime(iso: string): string {
  const diffMinutes = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 60_000
  );
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
}
