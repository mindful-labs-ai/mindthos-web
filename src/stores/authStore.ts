import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { SubscriptionInfo } from '@/feature/settings/services/creditService';
import { creditService } from '@/feature/settings/services/creditService';
import { authService } from '@/services/auth/authService';
import type { User, UserData } from '@/services/auth/types';

const loadSubscriptionInfo = async (
  userId: string | null
): Promise<SubscriptionInfo | null> => {
  if (!userId) return null;

  try {
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) return null;

    return await creditService.getSubscriptionInfo(userIdNumber);
  } catch (error) {
    console.error('Failed to load subscription info:', error);
    return null;
  }
};

interface AuthState {
  user: User | null;
  userId: string | null;
  userName: string | null;
  userPhoneNumber: string | null;
  organization: string | null;
  defaultTemplateId: number | null;
  subscriptionInfo: SubscriptionInfo | null;
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
  _setUser: (
    user: User | null,
    userData?: UserData | null,
    subscriptionInfo?: SubscriptionInfo | null
  ) => void;
  _setLoading: (isLoading: boolean) => void;
  setDefaultTemplateId: (templateId: number | null) => void;
  setSubscriptionInfo: (subscriptionInfo: SubscriptionInfo | null) => void;
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
      subscriptionInfo: null,
      isLoading: true,
      isAuthenticated: false,
      isInitialized: false,

      _setUser: (user, userData = null, subscriptionInfo = null) =>
        set(
          {
            user,
            userId: userData?.id ?? null,
            userName: userData?.name ?? null,
            userPhoneNumber: userData?.phoneNumber ?? null,
            organization: userData?.organization ?? null,
            defaultTemplateId: userData?.defaultTemplateId ?? null,
            subscriptionInfo,
            isAuthenticated: user !== null,
            isInitialized: true,
          },
          false,
          'setUser'
        ),
      _setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setDefaultTemplateId: (templateId) =>
        set({ defaultTemplateId: templateId }, false, 'setDefaultTemplateId'),

      setSubscriptionInfo: (subscriptionInfo) =>
        set({ subscriptionInfo }, false, 'setSubscriptionInfo'),

      clear: () =>
        set(
          {
            user: null,
            userId: null,
            userName: null,
            userPhoneNumber: null,
            organization: null,
            defaultTemplateId: null,
            subscriptionInfo: null,
            isAuthenticated: false,
            isLoading: false,
          },
          false,
          'clear'
        ),

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

        const userData = user?.email
          ? await authService.getUserDataByEmail(user.email)
          : null;

        const subscriptionInfo = await loadSubscriptionInfo(userData?.id);

        _setUser(user, userData, subscriptionInfo);
        _setLoading(false);
      },
    }),
    { name: 'AuthStore' }
  )
);
