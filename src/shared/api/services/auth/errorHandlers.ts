import { AuthError as SupabaseAuthError } from '@supabase/supabase-js';

import { ERROR_MESSAGES } from './constants';
import { AuthError, AuthErrorCode } from './types';

const EDGE_FUNCTION_ERROR_MAP: Record<string, AuthErrorCode> = {
  EMAIL_ALREADY_EXISTS: AuthErrorCode.EMAIL_ALREADY_EXISTS,
  INVALID_EMAIL_FORMAT: AuthErrorCode.INVALID_EMAIL_FORMAT,
  EMAIL_REQUIRED: AuthErrorCode.EMAIL_REQUIRED,
  USER_NOT_FOUND: AuthErrorCode.USER_NOT_FOUND,
  AUTH_USER_NOT_FOUND: AuthErrorCode.AUTH_USER_NOT_FOUND,
  EMAIL_ALREADY_VERIFIED: AuthErrorCode.EMAIL_ALREADY_VERIFIED,
};

export function handleEdgeFunctionError(error: unknown): AuthError {
  const err = error as { error?: string; message?: string; status?: number };

  if (err.status === 429) {
    return new AuthError(
      AuthErrorCode.RATE_LIMIT_EXCEEDED,
      err.message || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      error
    );
  }

  if (err.error && EDGE_FUNCTION_ERROR_MAP[err.error]) {
    return new AuthError(
      EDGE_FUNCTION_ERROR_MAP[err.error],
      err.message || ERROR_MESSAGES.GENERIC_ERROR,
      error
    );
  }

  return new AuthError(
    AuthErrorCode.UNKNOWN_ERROR,
    err.message || ERROR_MESSAGES.UNKNOWN_ERROR,
    error
  );
}

export function handleAuthError(error: unknown): AuthError {
  if (error instanceof SupabaseAuthError) {
    switch (error.status) {
      case 400:
        if (error.message.includes('Invalid login credentials')) {
          return new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            ERROR_MESSAGES.INVALID_CREDENTIALS,
            error
          );
        }
        if (error.message.includes('Email not confirmed')) {
          return new AuthError(
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            ERROR_MESSAGES.EMAIL_NOT_CONFIRMED,
            error
          );
        }
        break;

      case 422:
        if (error.message.includes('Password should be')) {
          return new AuthError(
            AuthErrorCode.WEAK_PASSWORD,
            ERROR_MESSAGES.WEAK_PASSWORD,
            error
          );
        }
        break;

      case 429:
        return new AuthError(
          AuthErrorCode.RATE_LIMIT_EXCEEDED,
          ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          error
        );
    }

    return new AuthError(
      AuthErrorCode.UNKNOWN_ERROR,
      error.message || ERROR_MESSAGES.GENERIC_AUTH_ERROR,
      error
    );
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        ERROR_MESSAGES.NETWORK_ERROR,
        error
      );
    }
  }

  return new AuthError(
    AuthErrorCode.UNKNOWN_ERROR,
    ERROR_MESSAGES.UNKNOWN_ERROR,
    error
  );
}
