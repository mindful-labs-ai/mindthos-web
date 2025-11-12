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

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange(
      (event: AuthChangeEvent, _session) => {
        const { initialize, clear } = useAuthStore.getState();
        switch (event) {
          case 'SIGNED_IN':
            toast({ title: '로그인 되었습니다', duration: 3000 });
            break;
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            initialize();
            break;

          case 'SIGNED_OUT':
            clear();
            toast({
              title: '로그아웃 되었습니다',
              duration: 3000,
            });
            navigate(ROUTES.AUTH);
            break;

          default:
            break;
        }
      }
    );

    useAuthStore.getState().initialize();

    return () => {
      unsubscribe();
    };
  }, [navigate, toast]);

  return <>{children}</>;
}
