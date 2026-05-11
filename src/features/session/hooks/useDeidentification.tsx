import { useCallback, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useCreditGuard } from '@/shared/hooks/useCreditGuard';
import { useToast } from '@/shared/ui/composites/Toast';
import {
  DeidentificationModal,
  type DeidModalPhase,
  type DeidStats,
} from '@/widgets/session/DeidentificationModal';

import type { TranscribeSegment } from '../types';

interface DeidResponse {
  success: boolean;
  session_id: string;
  stats: DeidStats;
}

const DEID_CREDIT = 20;

interface UseDeidentificationOptions {
  sessionId?: string;
  userId?: number;
  segments?: TranscribeSegment[];
  onSuccess?: () => void;
}

export function useDeidentification({
  sessionId,
  userId,
  segments,
  onSuccess,
}: UseDeidentificationOptions = {}) {
  const queryClient = useQueryClient();
  const checkCredit = useCreditGuard();
  const { toast } = useToast();
  const [showDeid, setShowDeid] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState<DeidModalPhase>('confirm');
  const [stats, setStats] = useState<DeidStats | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isDeidApplied = useMemo(
    () =>
      segments?.some((seg) => seg.deid && Object.keys(seg.deid).length > 0) ??
      false,
    [segments]
  );

  const handleDeidentify = useCallback(() => {
    if (!isDeidApplied) {
      setPhase('confirm');
      setStats(null);
      setErrorMessage('');
      setIsModalOpen(true);
    } else {
      setShowDeid((prev) => !prev);
    }
  }, [isDeidApplied]);

  const confirmDeidentify = useCallback(async () => {
    if (!sessionId || !userId) return;

    // 크레딧 가드
    const guard = await checkCredit(DEID_CREDIT);
    if (!guard.ok && !guard.unavailable) {
      toast({
        title: '크레딧 부족',
        description: `비식별화에 ${DEID_CREDIT} 크레딧이 필요해요. (보유: ${guard.remaining})`,
        duration: 5000,
      });
      return;
    }

    const idempotencyKey = crypto.randomUUID();

    setPhase('loading');
    try {
      const response = await callEdgeFunction<DeidResponse>(
        EDGE_FUNCTION_ENDPOINTS.DEID,
        {
          session_id: sessionId,
          user_id: userId,
          idempotency_key: idempotencyKey,
        }
      );

      setStats(response.stats);
      setPhase('complete');
      setShowDeid(true);
      onSuccess?.();

      // 크레딧 잔액 갱신
      queryClient.invalidateQueries({
        queryKey: creditQueryKeys.summary(userId),
      });
    } catch (err: unknown) {
      const error = err as {
        status?: number;
        error?: string;
        message?: string;
      };
      const status = error?.status;
      const errorCode = error?.error;
      const rawMessage = error?.message ?? '';

      let message = '비식별화 중 오류가 생겼어요.';
      if (rawMessage.startsWith('NO_DEID_TARGETS')) {
        message = 'NO_DEID_TARGETS';
      } else if (status === 402 || errorCode === 'INSUFFICIENT_CREDIT') {
        message = '비식별화에 필요한 크레딧이 부족해요.';
      } else if (status === 422 || errorCode === 'VALIDATION_FAILED') {
        message = '비식별화를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.';
      }

      setErrorMessage(message);
      setPhase('error');

      // 에러 시에도 크레딧 잔액 갱신
      queryClient.invalidateQueries({
        queryKey: creditQueryKeys.summary(userId),
      });
    }
  }, [sessionId, userId, checkCredit, toast, queryClient, onSuccess]);

  const handleModalClose = useCallback(
    (open: boolean) => {
      if (!open && phase === 'loading') return;
      setIsModalOpen(open);
    },
    [phase]
  );

  const deidModal = (
    <DeidentificationModal
      open={isModalOpen}
      onOpenChange={handleModalClose}
      onConfirm={confirmDeidentify}
      phase={phase}
      stats={stats}
      errorMessage={errorMessage}
    />
  );

  return {
    showDeid,
    isDeidApplied,
    handleDeidentify,
    deidModal,
  };
}
