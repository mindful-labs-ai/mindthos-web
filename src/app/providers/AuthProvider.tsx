import { useEffect } from 'react';

import { type AuthChangeEvent } from '@supabase/supabase-js';

import { ROUTES } from '@/app/router/constants';
import { queryClient } from '@/lib/queryClient';
import { authService } from '@/shared/api/services/auth/authService';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';
import { useSessionStore } from '@/stores/sessionStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { navigateWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();
  const { initialize, clear } = useAuthStore.getState();
  const initializeQuest = useQuestStore((state) => state.initializeQuest);
  const clearQuest = useQuestStore((state) => state.clear);

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        switch (event) {
          case 'SIGNED_IN':
            await initialize();
            if (session?.user?.email) {
              await initializeQuest(session.user.email);
            }
            break;

          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            await initialize();
            break;

          case 'SIGNED_OUT':
            clear();
            clearQuest();
            useSessionStore.getState().reset();
            queryClient.clear();
            navigateWithUtm(ROUTES.AUTH);
            break;

          default:
            break;
        }
      }
    );

    const initializeApp = async () => {
      await initialize();

      const { user } = useAuthStore.getState();
      if (user?.email) {
        await initializeQuest(user.email);
      }
    };

    initializeApp();

    return () => {
      unsubscribe();
    };
  }, [navigateWithUtm, toast, initializeQuest, clearQuest, initialize, clear]);

  return <>{children}</>;
}
