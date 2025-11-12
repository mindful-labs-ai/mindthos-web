import { useEffect } from 'react';

import { type AuthChangeEvent } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

import { useToast } from '@/components/ui/composites/Toast';
import { ROUTES } from '@/router/constants';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const initialize = useAuthStore((state) => state.initialize);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange(
      (event: AuthChangeEvent, _session) => {
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            initialize();
            break;

          case 'SIGNED_OUT':
            clear();
            toast({
              title: '로그아웃되었습니다',
              duration: 3000,
            });
            navigate(ROUTES.AUTH);
            break;

          default:
            break;
        }
      }
    );

    initialize();

    return () => {
      unsubscribe();
    };
  }, [navigate, toast, initialize, clear]);

  return <>{children}</>;
}
