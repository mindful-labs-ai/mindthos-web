import { useEffect } from 'react';

import { type AuthChangeEvent } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

import { useToast } from '@/components/ui/composites/Toast';
import { ROUTES } from '@/router/constants';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
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
            navigate(ROUTES.AUTH);
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
  }, [navigate, toast, initializeQuest, clearQuest, initialize, clear]);

  return <>{children}</>;
}
