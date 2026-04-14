import { useCallback, useMemo, useState } from 'react';

import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';
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

    setPhase('loading');
    try {
      const response = await callEdgeFunction<DeidResponse>(
        EDGE_FUNCTION_ENDPOINTS.DEID,
        { session_id: sessionId, user_id: userId }
      );

      setStats(response.stats);
      setPhase('complete');
      setShowDeid(true);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { status?: number; error?: string };
      const status = error?.status;
      const errorCode = error?.error;

      let message = '비식별화 중 오류가 발생했습니다.';
      if (status === 402 || errorCode === 'INSUFFICIENT_CREDIT') {
        message = '비식별화에 필요한 크레딧이 부족합니다.';
      } else if (status === 422 || errorCode === 'VALIDATION_FAILED') {
        message = '비식별화 검증에 실패했습니다. 다시 시도해주세요.';
      }

      setErrorMessage(message);
      setPhase('error');
    }
  }, [sessionId, userId, onSuccess]);

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
