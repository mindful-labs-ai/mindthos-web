import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  db_id?: string;
}

export interface UserDbRecord {
  id: number;
  name: string | null;
  email: string;
  phone_number: string | null;
  organization: string | null;
  default_template_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  organization: string | null;
  defaultTemplateId: number | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  metadata?: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
  };
}

export interface AuthResponse {
  user: User;
  needsEmailVerification?: boolean;
}

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  WEAK_PASSWORD: 'weak_password',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  USER_NOT_FOUND: 'user_not_found',
  AUTH_USER_NOT_FOUND: 'auth_user_not_found',
  EMAIL_ALREADY_VERIFIED: 'email_already_verified',
  INVALID_EMAIL_FORMAT: 'invalid_email_format',
  EMAIL_REQUIRED: 'email_required',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  NETWORK_ERROR: 'network_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export class AuthError extends Error {
  code: AuthErrorCode;
  originalError?: unknown;

  constructor(code: AuthErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface AuthApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface CheckUserExistsResponse extends AuthApiResponse {
  exists: boolean;
  user?: {
    id: number;
    email: string;
  };
}

export interface AccountDeleteResponse extends AuthApiResponse {
  deletedUser?: {
    id: number;
    email: string;
  };
}

export interface ResendVerificationResponse extends AuthApiResponse {
  email?: string;
}
