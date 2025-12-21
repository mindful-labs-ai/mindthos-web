import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import { callEdgeFunction } from '../../shared/utils/edgeFunctionClient';

import { EDGE_FUNCTION_ENDPOINTS, ERROR_MESSAGES } from './constants';
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
  type UserData,
  type UserDbRecord,
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

  async getUserDataByEmail(email: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_by_email', {
          user_email: email,
        })
        .single<UserDbRecord>();

      if (error) {
        console.error('getUserDataByEmail error:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: String(data.id),
        name: data.name,
        phoneNumber: data.phone_number,
        defaultTemplateId: data.default_template_id,
        organization: data.organization,
      };
    } catch (error) {
      console.error('getUserDataByEmail exception:', error);
      return null;
    }
  },

  async updateUser(
    userId: string,
    data: { name?: string; organization?: string }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          organization: data.organization,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parseInt(userId));

      if (error) throw handleAuthError(error);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
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

  async loginWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw handleAuthError(error);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },
};
