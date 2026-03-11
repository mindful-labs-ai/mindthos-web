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

// ── 공통 fetch 유틸 ──

interface RawUserAccessRow {
  id: string;
  access_id: string;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

interface RawAccessRow {
  id: string;
  type: string;
  name: string;
  description: string;
}

/**
 * user_accesses ↔ accesses 간 FK가 없으므로 두 단계로 조회 후 수동 매핑.
 */
async function fetchAndMergeAccesses(
  userAccessRows: RawUserAccessRow[]
): Promise<UserAccess[]> {
  if (userAccessRows.length === 0) return [];

  const accessIds = userAccessRows.map((r) => r.access_id);
  const { data: accessRows, error } = await supabase
    .from('accesses')
    .select('id, type, name, description')
    .in('id', accessIds);

  if (error) throw error;

  const accessMap = new Map(
    (accessRows as RawAccessRow[]).map((a) => [a.id, a])
  );

  return userAccessRows.flatMap((row) => {
    const access = accessMap.get(row.access_id);
    if (!access) return [];
    return [
      {
        id: row.id,
        type: access.type,
        name: access.name,
        description: access.description,
        grantedAt: row.granted_at,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
      },
    ];
  });
}

// ── 단일 접근 권한 조회 ──

const featureAccessQueryKey = (userId: string, type: string) =>
  ['featureAccess', userId, type] as const;

async function fetchUserAccess(
  userId: string,
  type: string
): Promise<UserAccess | null> {
  // 1단계: accesses 테이블에서 type으로 access_id 조회
  const { data: accessRow, error: accessError } = await supabase
    .from('accesses')
    .select('id, type, name, description')
    .eq('type', type)
    .maybeSingle();

  if (accessError) throw accessError;
  if (!accessRow) return null;

  // 2단계: user_accesses에서 해당 access_id 보유 여부 확인
  const { data: userAccessRow, error: userAccessError } = await supabase
    .from('user_accesses')
    .select('id, access_id, granted_at, expires_at, revoked_at')
    .eq('user_id', Number(userId))
    .eq('access_id', (accessRow as RawAccessRow).id)
    .is('revoked_at', null)
    .maybeSingle();

  if (userAccessError) throw userAccessError;
  if (!userAccessRow) return null;

  const row = userAccessRow as RawUserAccessRow;
  const access = accessRow as RawAccessRow;
  return {
    id: row.id,
    type: access.type,
    name: access.name,
    description: access.description,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  };
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
    .select('id, access_id, granted_at, expires_at, revoked_at')
    .eq('user_id', Number(userId))
    .is('revoked_at', null)
    .order('granted_at', { ascending: false });

  if (error) throw error;

  return fetchAndMergeAccesses((data ?? []) as RawUserAccessRow[]);
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
