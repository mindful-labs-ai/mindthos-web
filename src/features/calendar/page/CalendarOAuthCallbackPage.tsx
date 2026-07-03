import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '@/app/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { SplashLoading } from '@/shared/ui/composites/SplashLoading';
import { useToast } from '@/shared/ui/composites/Toast';

import { calendarImportAdapter } from '../adapters';
import {
  IMPORT_PROVIDER_KEY,
  type CalendarProvider,
} from '../adapters/import/types';

const VALID_PROVIDERS: CalendarProvider[] = ['google', 'naver', 'apple'];

function readProvider(): CalendarProvider | null {
  const stored = sessionStorage.getItem(IMPORT_PROVIDER_KEY);
  return stored && (VALID_PROVIDERS as string[]).includes(stored)
    ? (stored as CalendarProvider)
    : null;
}

/**
 * 외부 캘린더 import OAuth 콜백 페이지.
 * provider 동의 후 ?code=&state= 로 리다이렉트되는 대상.
 * code/state(+ sessionStorage의 provider)로 서버 finalize 호출 → 캘린더로 복귀.
 */
const CalendarOAuthCallbackPage = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // StrictMode 이중 실행/중복 finalize 방지.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const provider = readProvider();
    const error = params.get('error');

    const goBack = () => navigateWithUtm(ROUTES.CALENDAR, { replace: true });

    const run = async () => {
      if (error || !code || !state || !provider) {
        toast({
          title: '캘린더 연동 실패',
          description: '연동을 다시 시도해 주세요.',
        });
        goBack();
        return;
      }

      try {
        const result = await calendarImportAdapter.finalize(provider, {
          code,
          state,
        });
        sessionStorage.removeItem(IMPORT_PROVIDER_KEY);
        await queryClient.invalidateQueries({ queryKey: ['calendar'] });
        toast({
          title: '캘린더 연동 완료',
          description: `${result.categoryName} 일정을 가져왔어요.`,
        });
      } catch {
        toast({
          title: '캘린더 연동 실패',
          description: '연동을 다시 시도해 주세요.',
        });
      } finally {
        goBack();
      }
    };

    void run();
  }, [navigateWithUtm, queryClient, toast]);

  return <SplashLoading visible />;
};

export default CalendarOAuthCallbackPage;
