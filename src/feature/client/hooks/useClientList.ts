import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { clientQueryKeys } from '../constants/queryKeys';
import { clientService } from '../services/clientService';
import type { Client } from '../types';

export const useClientList = () => {
  const userId = useAuthStore((state) => state.userId);

  const query = useQuery({
    queryKey: userId ? clientQueryKeys.list(userId) : ['clients'],
    queryFn: async () => {
      if (!userId) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const response = await clientService.getClients({
        counselor_id: userId,
      });

      if (!response.success || !response.clients) {
        throw new Error('내담자 목록을 불러올 수 없습니다.');
      }

      const mappedClients: Client[] = response.clients.map((client) => ({
        ...client,
        counselor_id: userId,
      }));

      return mappedClients;
    },
    enabled: !!userId,
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
};
