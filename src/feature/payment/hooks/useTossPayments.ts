import { useEffect, useState } from 'react';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

import { TOSS_PAYMENTS_CONFIG } from '../config/tossPayments';

export const useTossPayments = (customerKey: string) => {
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initPayment() {
      try {
        console.log('[useTossPayments] Initializing...', {
          customerKey,
          clientKey: TOSS_PAYMENTS_CONFIG.clientKey,
        });
        setIsLoading(true);

        if (!TOSS_PAYMENTS_CONFIG.clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
        }

        const tossPayments = await loadTossPayments(
          TOSS_PAYMENTS_CONFIG.clientKey
        );
        const paymentInstance = tossPayments.payment({ customerKey });
        setPayment(paymentInstance);
        console.log('[useTossPayments] Initialized successfully');
      } catch (err) {
        console.error('[useTossPayments] Initialization failed:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to initialize Toss Payments')
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (customerKey) {
      initPayment();
    }
  }, [customerKey]);

  const requestBillingAuth = async (params: {
    customerName: string;
    customerEmail: string;
    planId?: string;
  }) => {
    if (!payment) {
      throw new Error('Toss Payments is not initialized');
    }

    try {
      await payment.requestBillingAuth({
        method: 'CARD',
        successUrl: TOSS_PAYMENTS_CONFIG.getSuccessUrl(params.planId),
        failUrl: TOSS_PAYMENTS_CONFIG.failUrl,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
      });
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to request billing auth');
    }
  };

  return {
    payment,
    isLoading,
    error,
    requestBillingAuth,
  };
};
