import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import {
  serverRequest,
  serverRequestPublic,
} from '@/shared/api/server/serverClient';
import { appendUtmParams, parseUtmPayload } from '@/shared/utils/utm';
import { useUtmStore } from '@/stores/utmStore';

import { AUTH_ENDPOINTS, ERROR_MESSAGES } from './constants';
import { handleAuthApiError, handleAuthError } from './errorHandlers';
import {
  AuthError,
  AuthErrorCode,
  type AccountDeleteResponse,
  type AuthResponse,
  type AuthProfileResponse,
  type CheckAuthMethodResponse,
  type CheckUserExistsResponse,
  type LoginCredentials,
  type ResendVerificationResponse,
  type SignUpData,
  type User,
  type UserData,
  type UserDbRecord,
} from './types';

function getAuthCallbackUrl(): string {
  const { shouldPropagateToUrl, utmParams } = useUtmStore.getState();
  return appendUtmParams(
    `${window.location.origin}/auth/callback`,
    shouldPropagateToUrl ? utmParams : ''
  );
}

function getStoredUtmMetadata(): Record<string, string> {
  return parseUtmPayload(useUtmStore.getState().utmParams);
}

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
          data: { ...signupData.metadata, ...getStoredUtmMetadata() },
          emailRedirectTo: getAuthCallbackUrl(),
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
      try {
        const profile =
          await serverRequest<AuthProfileResponse>('/auth/profile');
        return {
          id: profile.id,
          name: profile.name,
          phoneNumber: profile.phone_number,
          defaultTemplateId: profile.default_template_id,
          organization: profile.organization,
        };
      } catch (serverError) {
        console.warn(
          'getUserDataByEmail server profile unavailable; using legacy RPC',
          serverError
        );
      }

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
    data: {
      name?: string;
      organization?: string;
      phoneNumber?: string;
      referralSource?: string;
    }
  ): Promise<void> {
    try {
      const updatePayload: Record<string, unknown> = {
        name: data.name,
        organization: data.organization,
        phone_number: data.phoneNumber,
        updated_at: new Date().toISOString(),
      };
      if (data.referralSource !== undefined) {
        updatePayload.referral_source = data.referralSource;
      }

      const { error } = await supabase
        .from('users')
        .update(updatePayload)
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

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw handleAuthError(error);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },

  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw handleAuthError(error);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        '사용자 정보를 찾을 수 없어요.'
      );
    }

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        throw new AuthError(
          AuthErrorCode.INVALID_CREDENTIALS,
          '현재 비밀번호가 맞지 않아요.',
          verifyError
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw handleAuthError(updateError);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },

  async checkUserExists(email: string): Promise<CheckUserExistsResponse> {
    try {
      return await serverRequestPublic<CheckUserExistsResponse>(
        AUTH_ENDPOINTS.CHECK_USER_EXISTS,
        { method: 'POST', body: { email } }
      );
    } catch (error) {
      throw handleAuthApiError(error);
    }
  },

  async checkAuthMethod(email: string): Promise<CheckAuthMethodResponse> {
    try {
      return await serverRequestPublic<CheckAuthMethodResponse>(
        AUTH_ENDPOINTS.CHECK_AUTH_METHOD,
        { method: 'POST', body: { email } }
      );
    } catch (error) {
      throw handleAuthApiError(error);
    }
  },

  async deleteAccount(email: string): Promise<AccountDeleteResponse> {
    try {
      return await serverRequest<AccountDeleteResponse>(
        AUTH_ENDPOINTS.ACCOUNT_DELETE,
        { method: 'POST', body: { email } }
      );
    } catch (error) {
      throw handleAuthApiError(error);
    }
  },

  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    try {
      return await serverRequestPublic<ResendVerificationResponse>(
        AUTH_ENDPOINTS.RESEND_VERIFICATION,
        { method: 'POST', body: { email } }
      );
    } catch (error) {
      throw handleAuthApiError(error);
    }
  },

  async loginWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl(),
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

  async loginWithKakao(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) throw handleAuthError(error);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw handleAuthError(error);
    }
  },
};
