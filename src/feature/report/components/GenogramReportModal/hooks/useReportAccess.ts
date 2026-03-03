import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

interface UseReportAccessOptions {
  userId: string | null;
}

export interface UseReportAccessReturn {
  hasAccess: boolean | null;
  isChecking: boolean;
  checkAccess: () => Promise<boolean>;
  reset: () => void;
}

export function useReportAccess({
  userId,
}: UseReportAccessOptions): UseReportAccessReturn {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setHasAccess(false);
      return false;
    }
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('has_access', {
        p_user_id: Number(userId),
        p_access_type: 'GENOGRAM_SEMINAR',
      });
      if (error) {
        console.error('has_access RPC error:', error);
        setHasAccess(false);
        return false;
      }
      const result = !!data;
      setHasAccess(result);
      return result;
    } catch (e) {
      console.error('has_access check failed:', e);
      setHasAccess(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [userId]);

  const reset = useCallback(() => {
    setHasAccess(null);
  }, []);

  return { hasAccess, isChecking, checkAccess, reset };
}
