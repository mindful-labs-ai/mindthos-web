import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { identifyUser, resetMixpanel } from '@/lib/mixpanel';
import { queryClient } from '@/lib/queryClient';
import { authService } from '@/services/auth/authService';
import type { User, UserData } from '@/services/auth/types';

interface AuthState {
  user: User | null;
  userId: string | null;
  userName: string | null;
  userPhoneNumber: string | null;
  organization: string | null;
  defaultTemplateId: number | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    metadata?: {
      termsAccepted: boolean;
      privacyAccepted: boolean;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clear: () => void;
  _setUser: (user: User | null, userData?: UserData | null) => void;
  _setLoading: (isLoading: boolean) => void;
  setDefaultTemplateId: (templateId: number | null) => void;
  updateUser: (data: {
    name?: string;
    organization?: string;
    phoneNumber?: string;
  }) => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      userId: null,
      userName: null,
      userPhoneNumber: null,
      organization: null,
      defaultTemplateId: null,
      isLoading: true,
      isAuthenticated: false,
      isInitialized: false,

      _setUser: (user, userData = null) => {
        set(
          {
            user,
            userId: userData?.id ?? null,
            userName: userData?.name ?? null,
            userPhoneNumber: userData?.phoneNumber ?? null,
            organization: userData?.organization ?? null,
            defaultTemplateId: userData?.defaultTemplateId ?? null,
            isAuthenticated: user !== null,
            isInitialized: true,
          },
          false,
          'setUser'
        );

        if (user?.id) {
          identifyUser(user.id, {
            email: user.email,
            name: userData?.name,
            organization: userData?.organization,
          });
        }
      },
      _setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setDefaultTemplateId: (templateId) =>
        set({ defaultTemplateId: templateId }, false, 'setDefaultTemplateId'),

      updateUser: async (data) => {
        const { userId } = get();
        if (!userId) return;

        await authService.updateUser(userId, data);

        set(
          (state) => ({
            userName: data.name ?? state.userName,
            organization: data.organization ?? state.organization,
            userPhoneNumber: data.phoneNumber ?? state.userPhoneNumber,
          }),
          false,
          'updateUser'
        );

        // Update React Query cache if user data was fetched
        const user = get().user;
        if (user?.email) {
          queryClient.invalidateQueries({
            queryKey: ['user', 'data', user.email],
          });
        }
      },

      clear: () => {
        set(
          {
            user: null,
            userId: null,
            userName: null,
            userPhoneNumber: null,
            organization: null,
            defaultTemplateId: null,
            isAuthenticated: false,
            isLoading: false,
          },
          false,
          'clear'
        );
        resetMixpanel();
      },

      login: async (email, password) => {
        await authService.login({ email, password });
      },

      loginWithGoogle: async () => {
        await authService.loginWithGoogle();
      },

      signup: async (email, password, metadata) => {
        await authService.signup({
          email,
          password,
          metadata,
        });
      },

      logout: async () => {
        await authService.logout();
      },

      initialize: async () => {
        const { _setUser, _setLoading } = get();

        const session = await authService.getSession();
        const user = session?.user ?? null;

        // React Query 캐시를 활용하여 getUserDataByEmail 호출
        // 캐시에 있으면 캐시에서 가져오고, 없으면 fetch 후 캐싱
        const userData = user?.email
          ? await queryClient.fetchQuery({
              queryKey: ['user', 'data', user.email],
              queryFn: () => authService.getUserDataByEmail(user.email!),
              staleTime: Infinity, // 캐시 무한 유지
            })
          : null;

        _setUser(user, userData);
        _setLoading(false);
      },
    }),
    { name: 'AuthStore' }
  )
);
