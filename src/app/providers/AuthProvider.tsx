import { useEffect } from 'react';

import { type AuthChangeEvent } from '@supabase/supabase-js';

import { ROUTES } from '@/app/router/constants';
import { queryClient } from '@/lib/queryClient';
import { authService } from '@/shared/api/services/auth/authService';
import { tutorialService } from '@/shared/api/services/tutorial/tutorialService';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { removeUtmParamsFromCurrentUrl } from '@/shared/utils/utm';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUtmStore } from '@/stores/utmStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { navigateWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();
  const { initialize, clear } = useAuthStore.getState();
  const initializeQuest = useQuestStore((state) => state.initializeQuest);
  const clearQuest = useQuestStore((state) => state.clear);

  useEffect(() => {
    const syncLegacyQuest = async (email: string) => {
      try {
        const tutorialState = await tutorialService.current();

        // migration으로 보상 수령 완료를 기록한 사용자만 레거시 온보딩을
        // 계속 사용한다. 신규 사용자는 public.onboarding 트리거 행이
        // 있어도 신규 Tutorial이 구형 카드와 함께 노출되지 않도록 정리한다.
        if (tutorialState.reward_claimed_at) {
          await initializeQuest(email);
          return;
        }

        clearQuest();
      } catch (error) {
        console.error('Legacy onboarding sync failed:', error);
        clearQuest();
      }
    };

    const { unsubscribe } = authService.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        switch (event) {
          case 'SIGNED_IN':
            useUtmStore.getState().initializeUtm(window.location.search);
            useUtmStore.getState().stopUrlPropagation();
            removeUtmParamsFromCurrentUrl();
            await initialize();
            if (session?.user?.email) {
              await syncLegacyQuest(session.user.email);
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
        useUtmStore.getState().initializeUtm(window.location.search);
        useUtmStore.getState().stopUrlPropagation();
        removeUtmParamsFromCurrentUrl();
        await syncLegacyQuest(user.email);
      }
    };

    initializeApp();

    return () => {
      unsubscribe();
    };
  }, [navigateWithUtm, toast, initializeQuest, clearQuest, initialize, clear]);

  return <>{children}</>;
}
