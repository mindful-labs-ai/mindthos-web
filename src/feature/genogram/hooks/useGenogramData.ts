import { useCallback, useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { genogramService } from '../services/genogramService';

const GENOGRAM_QUERY_KEY = 'genogram';
const AUTO_SAVE_DELAY = 3000;

export function useGenogramData(clientId: string) {
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const pendingDataRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: initialData, isLoading } = useQuery({
    queryKey: [GENOGRAM_QUERY_KEY, clientId],
    queryFn: () => genogramService.getByClientId(clientId),
    enabled: !!clientId,
    staleTime: Infinity,
  });

  const { mutate: saveMutation, isPending: isSaving } = useMutation({
    mutationFn: (jsonData: string) =>
      genogramService.save(clientId, userId!, jsonData),
    onSuccess: () => {
      setLastSavedAt(new Date());
      // 저장 완료 후 pending 데이터가 있으면 다시 저장 예약
      if (pendingDataRef.current) {
        const next = pendingDataRef.current;
        pendingDataRef.current = null;
        scheduleSave(next);
      }
    },
  });

  const scheduleSave = useCallback(
    (jsonData: string) => {
      pendingDataRef.current = jsonData;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const data = pendingDataRef.current;
        if (data && userId) {
          pendingDataRef.current = null;
          saveMutation(data);
        }
      }, AUTO_SAVE_DELAY);
    },
    [saveMutation, userId]
  );

  /** 데이터 변경 시 호출 — debounce 자동저장 */
  const onChange = useCallback(
    (jsonData: string) => {
      queryClient.setQueryData([GENOGRAM_QUERY_KEY, clientId], jsonData);
      scheduleSave(jsonData);
    },
    [clientId, queryClient, scheduleSave]
  );

  /** 즉시 저장 */
  const saveNow = useCallback(
    (jsonData: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      pendingDataRef.current = null;
      if (userId) {
        saveMutation(jsonData);
      }
    },
    [saveMutation, userId]
  );

  // beforeunload 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (pendingDataRef.current || isSaving) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isSaving]);

  // clientId 변경 시 pending 저장 취소 (다른 클라이언트에 저장되는 것 방지)
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingDataRef.current = null;
    };
  }, [clientId]);

  return {
    initialData: initialData ?? null,
    hasData: initialData !== null,
    isLoading,
    isSaving,
    lastSavedAt,
    onChange,
    saveNow,
  };
}
