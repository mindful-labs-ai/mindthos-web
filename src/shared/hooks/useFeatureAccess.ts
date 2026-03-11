import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type AccessType = string;

export interface UserAccess {
  /** user_accesses.id */
  id: string;
  /** accesses.type */
  type: string;
  /** accesses.name (e.g. "가계도 세미나 수료") */
  name: string;
  /** accesses.description */
  description: string;
  /** 권한 부여 시각 */
  grantedAt: string;
  /** 만료 시각 (null이면 영구) */
  expiresAt: string | null;
  /** 해지 시각 (null이면 유효) */
  revokedAt: string | null;
}

// ── 공통 파싱 ──

interface RawUserAccess {
  id: string;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  accesses: { type: string; name: string; description: string };
}

function parseUserAccess(raw: RawUserAccess): UserAccess {
  const access = raw.accesses as {
    type: string;
    name: string;
    description: string;
  };
  return {
    id: raw.id,
    type: access.type,
    name: access.name,
    description: access.description,
    grantedAt: raw.granted_at,
    expiresAt: raw.expires_at,
    revokedAt: raw.revoked_at,
  };
}

const ACCESS_SELECT = `
  id,
  granted_at,
  expires_at,
  revoked_at,
  accesses!inner (
    type,
    name,
    description
  )
`;

// ── 단일 접근 권한 조회 ──

const featureAccessQueryKey = (userId: string, type: string) =>
  ['featureAccess', userId, type] as const;

async function fetchUserAccess(
  userId: string,
  type: string
): Promise<UserAccess | null> {
  const { data, error } = await supabase
    .from('user_accesses')
    .select(ACCESS_SELECT)
    .eq('user_id', Number(userId))
    .eq('accesses.type', type)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return parseUserAccess(data as unknown as RawUserAccess);
}

export function useFeatureAccess(type: string) {
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: featureAccessQueryKey(userId ?? '', type),
    queryFn: () => fetchUserAccess(userId!, type),
    enabled: !!userId,
    staleTime: Infinity,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    if (!userId) return;
    queryClient.invalidateQueries({
      queryKey: featureAccessQueryKey(userId, type),
    });
  };

  return {
    /** 권한 보유 여부 */
    hasAccess: !!data,
    /** 로딩 중 여부 */
    isChecking: isLoading,
    /** 권한 상세 정보 (없으면 null) */
    access: data ?? null,
    /** 캐시 무효화 */
    invalidate,
  };
}

// ── 유저의 전체 접근 권한 목록 조회 ──

const userAccessesQueryKey = (userId: string) =>
  ['userAccesses', userId] as const;

async function fetchAllUserAccesses(userId: string): Promise<UserAccess[]> {
  const { data, error } = await supabase
    .from('user_accesses')
    .select(ACCESS_SELECT)
    .eq('user_id', Number(userId))
    .is('revoked_at', null)
    .order('granted_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as RawUserAccess[]).map(parseUserAccess);
}

export function useUserAccesses() {
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: userAccessesQueryKey(userId ?? ''),
    queryFn: () => fetchAllUserAccesses(userId!),
    enabled: !!userId,
    staleTime: Infinity,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    if (!userId) return;
    queryClient.invalidateQueries({
      queryKey: userAccessesQueryKey(userId),
    });
  };

  return {
    /** 유저의 모든 접근 권한 목록 */
    accesses: data ?? [],
    /** 로딩 중 여부 */
    isLoading,
    /** 특정 타입의 권한 보유 여부 */
    hasAccess: (type: string) => (data ?? []).some((a) => a.type === type),
    /** 특정 타입의 권한 상세 조회 */
    getAccess: (type: string) =>
      (data ?? []).find((a) => a.type === type) ?? null,
    /** 캐시 무효화 */
    invalidate,
  };
}
