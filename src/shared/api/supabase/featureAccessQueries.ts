import { supabase } from '@/lib/supabase';

type AccessType = 'GENOGRAM_SEMINAR';

/**
 * 기능 접근 권한 확인 (RPC)
 */
export async function checkFeatureAccess(
  userId: string,
  type: AccessType
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_access', {
    p_user_id: Number(userId),
    p_access_type: type,
  });

  if (error) {
    if (!import.meta.env.PROD)
      console.error('has_access RPC error:', error.message);
    return false;
  }

  return !!data;
}
