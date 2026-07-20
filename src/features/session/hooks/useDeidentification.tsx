import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { deidentifyTranscript } from '@/shared/api/server/transcriptServerApi';
import { CREDIT_COST } from '@/shared/constants/credit';
import {
  creditQueryKeys,
  sessionQueryKeys,
} from '@/shared/constants/queryKeys';
import { useCreditGuard } from '@/shared/hooks/useCreditGuard';
import { useToast } from '@/shared/ui/composites/Toast';
import {
  DeidentificationModal,
  type DeidModalPhase,
  type DeidStats,
} from '@/widgets/session/DeidentificationModal';

import type { TranscribeSegment } from '../types';

const DEID_CREDIT = CREDIT_COST.DEIDENTIFICATION;

interface UseDeidentificationOptions {
  sessionId?: string;
  transcribeId?: string;
  revision?: number;
  contentsFingerprint?: string;
  userId?: number;
  segments?: TranscribeSegment[];
  onSuccess?: () => void;
}

interface DeidentificationTarget {
  sessionId: string;
  transcribeId: string;
  revision: number;
  contentsFingerprint: string;
  userId: number;
}

export function useDeidentification({
  sessionId,
  transcribeId,
  revision,
  contentsFingerprint,
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
  const targetRef = useRef<DeidentificationTarget | null>(null);
  const identityRef = useRef(`${sessionId ?? ''}:${transcribeId ?? ''}`);
  const requestGenerationRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const isDeidApplied = useMemo(
    () =>
      segments?.some((seg) => seg.deid && Object.keys(seg.deid).length > 0) ??
      false,
    [segments]
  );

  const targetIdentity = `${sessionId ?? ''}:${transcribeId ?? ''}`;

  useEffect(() => {
    if (identityRef.current === targetIdentity) return;

    identityRef.current = targetIdentity;
    requestGenerationRef.current += 1;
    isSubmittingRef.current = false;
    targetRef.current = null;
    setShowDeid(false);
    setIsModalOpen(false);
    setPhase('confirm');
    setStats(null);
    setErrorMessage('');
  }, [targetIdentity]);

  const handleDeidentify = useCallback(() => {
    if (!isDeidApplied) {
      if (
        !sessionId ||
        !transcribeId ||
        revision === undefined ||
        !contentsFingerprint ||
        userId === undefined
      ) {
        return;
      }
      targetRef.current = {
        sessionId,
        transcribeId,
        revision,
        contentsFingerprint,
        userId,
      };
      setPhase('confirm');
      setStats(null);
      setErrorMessage('');
      setIsModalOpen(true);
    } else {
      setShowDeid((prev) => !prev);
    }
  }, [
    contentsFingerprint,
    isDeidApplied,
    revision,
    sessionId,
    transcribeId,
    userId,
  ]);

  const reconcileTargetCaches = useCallback(
    async (target: DeidentificationTarget) => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: sessionQueryKeys.detail(target.sessionId, false),
        }),
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(target.userId),
        }),
      ]);
    },
    [queryClient]
  );

  const confirmDeidentify = useCallback(async () => {
    const target = targetRef.current;
    if (!target || isSubmittingRef.current) return;
    if (`${target.sessionId}:${target.transcribeId}` !== identityRef.current) {
      setIsModalOpen(false);
      return;
    }

    const generation = requestGenerationRef.current;
    isSubmittingRef.current = true;
    setPhase('loading');
    let commandSent = false;

    // 크레딧 가드
    try {
      const guard = await checkCredit(DEID_CREDIT);
      if (generation !== requestGenerationRef.current) return;
      if (!guard.ok && !guard.unavailable) {
        toast({
          title: '크레딧 부족',
          description: `비식별화에 ${DEID_CREDIT} 크레딧이 필요해요. (보유: ${guard.remaining})`,
          duration: 5000,
        });
        setPhase('confirm');
        return;
      }

      commandSent = true;
      const response = await deidentifyTranscript({
        sessionId: target.sessionId,
        transcribeId: target.transcribeId,
        expectedRevision: target.revision,
        expectedContentsFingerprint: target.contentsFingerprint,
      });
      await reconcileTargetCaches(target);
      if (generation !== requestGenerationRef.current) return;

      setStats(response.stats);
      setPhase('complete');
      setShowDeid(true);
      onSuccess?.();
    } catch (err: unknown) {
      if (commandSent) {
        await reconcileTargetCaches(target);
      }
      if (generation !== requestGenerationRef.current) return;
      const error = err as {
        status?: number;
        statusCode?: string;
        message?: string;
      };
      const status = error?.status;
      const rawMessage = error?.message ?? '';

      let message = '비식별화 중 오류가 생겼어요.';
      if (status === 422 && rawMessage.includes('대상이 발견되지')) {
        message = 'NO_DEID_TARGETS';
      } else if (status === 402) {
        message = '비식별화에 필요한 크레딧이 부족해요.';
      } else if (status === 409) {
        message =
          '처리 중 축어록이 변경됐어요. 최신 내용을 불러온 뒤 다시 시도해 주세요.';
      } else if (status === undefined || status >= 500) {
        message = '처리 결과를 확인할 수 없어 최신 내용을 다시 불러왔어요.';
      } else if (status === 422) {
        message = '비식별화를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.';
      }

      setErrorMessage(message);
      setPhase('error');
    } finally {
      if (generation === requestGenerationRef.current) {
        isSubmittingRef.current = false;
      }
    }
  }, [checkCredit, toast, reconcileTargetCaches, onSuccess]);

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
