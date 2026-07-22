import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deidentifyTranscript,
  getDeidentificationStatus,
  type DeidentificationStatusResponse,
} from '@/shared/api/server/transcriptServerApi';
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
const DEID_POLL_INTERVAL_MS = 3000;

function isInFlight(status: DeidentificationStatusResponse['status']): boolean {
  return status === 'pending' || status === 'processing';
}

function failedStatusMessage(errorCode?: string): string {
  if (errorCode === 'NO_DEID_TARGETS') return 'NO_DEID_TARGETS';
  if (errorCode === 'INSUFFICIENT_CREDIT') {
    return '비식별화에 필요한 크레딧이 부족해요.';
  }
  if (
    errorCode === 'TRANSCRIPT_CONFLICT' ||
    errorCode === 'TRANSCRIPT_CHANGED' ||
    errorCode === 'REVISION_CONFLICT'
  ) {
    return '처리 중 축어록이 변경됐어요. 최신 내용을 불러온 뒤 다시 시도해 주세요.';
  }
  return '비식별화 중 오류가 생겼어요.';
}

function requestErrorMessage(error: {
  status?: number;
  message?: string;
}): string {
  const status = error.status;
  const rawMessage = error.message ?? '';

  if (status === 422 && rawMessage.includes('대상이 발견되지')) {
    return 'NO_DEID_TARGETS';
  }
  if (status === 402) {
    return '비식별화에 필요한 크레딧이 부족해요.';
  }
  if (status === 409) {
    return '처리 중 축어록이 변경됐어요. 최신 내용을 불러온 뒤 다시 시도해 주세요.';
  }
  if (status === undefined || status >= 500) {
    return '처리 결과를 확인할 수 없어 최신 내용을 다시 불러왔어요.';
  }
  if (status === 422) {
    return '비식별화를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
  return '비식별화 중 오류가 생겼어요.';
}

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
  const trackedJobIdRef = useRef<string | null>(null);
  const handledTerminalIdRef = useRef<string | null>(null);

  const isDeidApplied = useMemo(
    () =>
      segments?.some((seg) => seg.deid && Object.keys(seg.deid).length > 0) ??
      false,
    [segments]
  );

  const targetIdentity = `${sessionId ?? ''}:${transcribeId ?? ''}`;
  const statusQueryKey = sessionQueryKeys.deidentificationStatus(
    sessionId ?? '',
    transcribeId ?? ''
  );
  const canTrackStatus =
    !!sessionId &&
    !!transcribeId &&
    revision !== undefined &&
    !!contentsFingerprint &&
    userId !== undefined &&
    !isDeidApplied;

  const statusQuery = useQuery<DeidentificationStatusResponse | null>({
    queryKey: statusQueryKey,
    queryFn: async () => {
      try {
        return await getDeidentificationStatus({
          sessionId: sessionId!,
          transcribeId: transcribeId!,
        });
      } catch (error: unknown) {
        if ((error as { status?: number }).status === 404) return null;
        throw error;
      }
    },
    enabled: canTrackStatus,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: (failureCount, error) =>
      (error as { status?: number }).status !== 404 && failureCount < 3,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && isInFlight(status)) return DEID_POLL_INTERVAL_MS;
      return query.state.data === null && isSubmittingRef.current
        ? DEID_POLL_INTERVAL_MS
        : false;
    },
  });

  useEffect(() => {
    if (identityRef.current === targetIdentity) return;

    identityRef.current = targetIdentity;
    requestGenerationRef.current += 1;
    isSubmittingRef.current = false;
    trackedJobIdRef.current = null;
    handledTerminalIdRef.current = null;
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

  useEffect(() => {
    const response = statusQuery.data;
    if (
      !response ||
      response.session_id !== sessionId ||
      response.transcribe_id !== transcribeId ||
      revision === undefined ||
      !contentsFingerprint ||
      userId === undefined
    ) {
      return;
    }

    const target: DeidentificationTarget = {
      sessionId,
      transcribeId,
      revision,
      contentsFingerprint,
      userId,
    };
    targetRef.current = target;

    if (isInFlight(response.status)) {
      trackedJobIdRef.current = response.id;
      isSubmittingRef.current = true;
      setStats(null);
      setErrorMessage('');
      setPhase('loading');
      setIsModalOpen(true);
      return;
    }

    if (trackedJobIdRef.current !== response.id) return;
    if (handledTerminalIdRef.current === response.id) return;
    handledTerminalIdRef.current = response.id;
    isSubmittingRef.current = false;
    const generation = requestGenerationRef.current;

    void (async () => {
      await reconcileTargetCaches(target);
      if (generation !== requestGenerationRef.current) return;

      setIsModalOpen(true);
      if (response.status === 'succeeded' && response.stats) {
        setStats(response.stats);
        setErrorMessage('');
        setPhase('complete');
        setShowDeid(true);
        onSuccess?.();
        return;
      }

      setStats(null);
      setErrorMessage(
        response.status === 'failed'
          ? failedStatusMessage(response.error_code)
          : '비식별화 결과를 확인하지 못했어요.'
      );
      setPhase('error');
    })();
  }, [
    contentsFingerprint,
    onSuccess,
    reconcileTargetCaches,
    revision,
    sessionId,
    statusQuery.data,
    transcribeId,
    userId,
  ]);

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
    let accepted = false;

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
      if (
        response.session_id !== target.sessionId ||
        response.transcribe_id !== target.transcribeId
      ) {
        throw new Error('비식별화 작업 대상이 일치하지 않아요.');
      }

      const targetStatusQueryKey = sessionQueryKeys.deidentificationStatus(
        target.sessionId,
        target.transcribeId
      );
      await queryClient.cancelQueries({ queryKey: targetStatusQueryKey });
      if (generation !== requestGenerationRef.current) return;
      trackedJobIdRef.current = response.id;
      queryClient.setQueryData(targetStatusQueryKey, response);
      accepted = true;
    } catch (err: unknown) {
      if (commandSent) {
        await reconcileTargetCaches(target);
      }
      if (generation !== requestGenerationRef.current) return;
      setErrorMessage(
        requestErrorMessage(err as { status?: number; message?: string })
      );
      setPhase('error');
    } finally {
      if (generation === requestGenerationRef.current && !accepted) {
        isSubmittingRef.current = false;
      }
    }
  }, [checkCredit, toast, reconcileTargetCaches, queryClient]);

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
