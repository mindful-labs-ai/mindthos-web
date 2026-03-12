import { useEffect } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { useFeatureAccessStore } from '@/stores/featureAccessStore';

/**
 * 앱 초기화 시 실행되는 컴포넌트들을 관리
 * - 기능 접근 권한 확인
 */
export const AppInitialize = () => {
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      useFeatureAccessStore.getState().resetAll();
      return;
    }

    useFeatureAccessStore.getState().checkAccess(userId, 'GENOGRAM_SEMINAR');
  }, [isAuthenticated, userId]);

  return null;
};
