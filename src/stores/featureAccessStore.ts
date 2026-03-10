import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { checkFeatureAccess } from '@/shared/api/supabase/featureAccessQueries';

type AccessType = 'GENOGRAM_SEMINAR';

interface FeatureAccessState {
  /** 기능별 접근 권한 캐시 (null = 미확인) */
  access: Partial<Record<AccessType, boolean | null>>;
  /** 기능별 로딩 상태 */
  checking: Partial<Record<AccessType, boolean>>;
}

interface FeatureAccessActions {
  /** 특정 기능 권한 확인 (서버 RPC) */
  checkAccess: (userId: string, type: AccessType) => Promise<boolean>;
  /** 특정 기능 권한 초기화 */
  resetAccess: (type: AccessType) => void;
  /** 전체 초기화 */
  resetAll: () => void;
}

type FeatureAccessStore = FeatureAccessState & FeatureAccessActions;

const initialState: FeatureAccessState = {
  access: {},
  checking: {},
};

export const useFeatureAccessStore = create<FeatureAccessStore>()(
  devtools(
    (set) => ({
      ...initialState,

      checkAccess: async (userId, type) => {
        set(
          (s) => ({ checking: { ...s.checking, [type]: true } }),
          false,
          'checkAccess/start'
        );

        try {
          const result = await checkFeatureAccess(userId, type);
          set(
            (s) => ({
              access: { ...s.access, [type]: result },
              checking: { ...s.checking, [type]: false },
            }),
            false,
            'checkAccess/done'
          );
          return result;
        } catch (e) {
          if (!import.meta.env.PROD)
            console.error(
              'has_access check failed:',
              e instanceof Error ? e.message : e
            );
          set(
            (s) => ({
              access: { ...s.access, [type]: false },
              checking: { ...s.checking, [type]: false },
            }),
            false,
            'checkAccess/catch'
          );
          return false;
        }
      },

      resetAccess: (type) => {
        set(
          (s) => ({
            access: { ...s.access, [type]: null },
            checking: { ...s.checking, [type]: false },
          }),
          false,
          'resetAccess'
        );
      },

      resetAll: () => set(initialState, false, 'resetAll'),
    }),
    { name: 'FeatureAccessStore', enabled: !import.meta.env.PROD }
  )
);
