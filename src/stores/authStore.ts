import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { authService } from '@/services/auth/authService';
import type { User } from '@/services/auth/types';

interface AuthState {
  user: User | null;
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
  _setUser: (user: User | null) => void;
  _setLoading: (isLoading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isInitialized: false,

      _setUser: (user) =>
        set(
          { user, isAuthenticated: user !== null, isInitialized: true },
          false,
          'setUser'
        ),
      _setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      clear: () =>
        set(
          {
            user: null,
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
        _setUser(session?.user ?? null);
        _setLoading(false);
      },
    }),
    { name: 'AuthStore' }
  )
);
