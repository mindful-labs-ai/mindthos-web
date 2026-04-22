import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';

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
    return await callEdgeFunction<PhoneVerificationStatusResponse>(
      EDGE_FUNCTION_ENDPOINTS.AUTH.PHONE_VERIFICATION.STATUS
    );
  },

  async requestCode(
    phoneNumber: string
  ): Promise<PhoneVerificationRequestResponse> {
    return await callEdgeFunction<PhoneVerificationRequestResponse>(
      EDGE_FUNCTION_ENDPOINTS.AUTH.PHONE_VERIFICATION.REQUEST,
      { phone_number: phoneNumber }
    );
  },

  async verifyCode(code: string): Promise<PhoneVerificationVerifyResponse> {
    return await callEdgeFunction<PhoneVerificationVerifyResponse>(
      EDGE_FUNCTION_ENDPOINTS.AUTH.PHONE_VERIFICATION.VERIFY,
      { code }
    );
  },
};
