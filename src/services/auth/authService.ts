import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import { EDGE_FUNCTION_ENDPOINTS, ERROR_MESSAGES } from './constants';
import { callEdgeFunction } from './edgeFunctionClient';
import { handleAuthError, handleEdgeFunctionError } from './errorHandlers';
import {
  AuthError,
  AuthErrorCode,
  type AccountDeleteResponse,
  type AuthResponse,
  type CheckUserExistsResponse,
  type LoginCredentials,
  type ResendVerificationResponse,
  type SignUpData,
  type User,
} from './types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw handleAuthError(error);
      if (!data.user) {
        throw new AuthError(
          AuthErrorCode.UNKNOWN_ERROR,
          ERROR_MESSAGES.LOGIN_FAILED
        );
      }

      return { user: data.user };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },

  async signup(signupData: SignUpData): Promise<AuthResponse> {
    await supabase.auth.signOut();

    try {
      await this.checkUserExists(signupData.email);

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: signupData.metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw handleAuthError(error);
      if (!data.user) {
        throw new AuthError(
          AuthErrorCode.UNKNOWN_ERROR,
          ERROR_MESSAGES.SIGNUP_FAILED
        );
      }

      return {
        user: data.user,
        needsEmailVerification: !data.session,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw handleAuthError(error);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw handleAuthError(error);
      return user;
    } catch {
      return null;
    }
  },

  async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw handleAuthError(error);
      return session;
    } catch {
      return null;
    }
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): {
    unsubscribe: () => void;
  } {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  },

  async resendEmailVerification(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw handleAuthError(error);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },

  async checkUserExists(email: string): Promise<CheckUserExistsResponse> {
    try {
      return await callEdgeFunction<CheckUserExistsResponse>(
        EDGE_FUNCTION_ENDPOINTS.CHECK_USER_EXISTS,
        { email }
      );
    } catch (error) {
      throw handleEdgeFunctionError(error);
    }
  },

  async deleteAccount(email: string): Promise<AccountDeleteResponse> {
    try {
      return await callEdgeFunction<AccountDeleteResponse>(
        EDGE_FUNCTION_ENDPOINTS.ACCOUNT_DELETE,
        { email }
      );
    } catch (error) {
      throw handleEdgeFunctionError(error);
    }
  },

  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    try {
      return await callEdgeFunction<ResendVerificationResponse>(
        EDGE_FUNCTION_ENDPOINTS.RESEND_VERIFICATION,
        { email }
      );
    } catch (error) {
      throw handleEdgeFunctionError(error);
    }
  },
};
