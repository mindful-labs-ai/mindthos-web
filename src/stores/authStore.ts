import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

      _setUser: (user, userData = null) =>
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
        ),
      _setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setDefaultTemplateId: (templateId) =>
        set({ defaultTemplateId: templateId }, false, 'setDefaultTemplateId'),

      clear: () =>
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
        ),

      login: async (email, password) => {
        await authService.login({ email, password });
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

        const userData = user?.email
          ? await authService.getUserDataByEmail(user.email)
          : null;

        _setUser(user, userData);
        _setLoading(false);
      },
    }),
    { name: 'AuthStore' }
  )
);
