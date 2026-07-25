import { serverRequest } from '@/shared/api/server/serverClient';
import { AUTH_ENDPOINTS } from '@/shared/api/services/auth/constants';

export interface PhoneVerificationStatusResponse {
  success: boolean;
  required: boolean;
  verified_at: string | null;
}

export interface PhoneVerificationRequestResponse {
  success: boolean;
  message: string;
  expires_at: string;
  cooldown_seconds: number;
}

export interface PhoneVerificationVerifyResponse {
  success: boolean;
  message: string;
  verified_at: string;
  phone_number: string;
}

export const phoneVerificationService = {
  async checkStatus(): Promise<PhoneVerificationStatusResponse> {
    return await serverRequest<PhoneVerificationStatusResponse>(
      AUTH_ENDPOINTS.PHONE_VERIFICATION.STATUS,
      { method: 'POST' }
    );
  },

  async requestCode(
    phoneNumber: string
  ): Promise<PhoneVerificationRequestResponse> {
    return await serverRequest<PhoneVerificationRequestResponse>(
      AUTH_ENDPOINTS.PHONE_VERIFICATION.REQUEST,
      { method: 'POST', body: { phone_number: phoneNumber } }
    );
  },

  async verifyCode(code: string): Promise<PhoneVerificationVerifyResponse> {
    return await serverRequest<PhoneVerificationVerifyResponse>(
      AUTH_ENDPOINTS.PHONE_VERIFICATION.VERIFY,
      { method: 'POST', body: { code } }
    );
  },
};
