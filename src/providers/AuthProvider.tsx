import { useEffect } from 'react';

import { type AuthChangeEvent } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

import { useToast } from '@/components/ui/composites/Toast';
import { ROUTES } from '@/router/constants';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        const { initialize, clear } = useAuthStore.getState();
        const { checkOnboarding, clear: clearOnboarding } =
          useOnboardingStore.getState();

        switch (event) {
          case 'SIGNED_IN':
            await initialize();
            if (session?.user?.email) {
              await checkOnboarding(session.user.email);
            }
            break;

          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            await initialize();
            break;

          case 'SIGNED_OUT':
            clear();
            clearOnboarding();
            // toast({
            //   title: '로그아웃 되었습니다',
            //   duration: 3000,
            // });
            navigate(ROUTES.AUTH);
            break;

          default:
            break;
        }
      }
    );

    const initializeApp = async () => {
      await useAuthStore.getState().initialize();

      const { user } = useAuthStore.getState();
      if (user?.email) {
        await useOnboardingStore.getState().checkOnboarding(user.email);
      }
    };

    initializeApp();

    return () => {
      unsubscribe();
    };
  }, [navigate, toast]);

  return <>{children}</>;
}
