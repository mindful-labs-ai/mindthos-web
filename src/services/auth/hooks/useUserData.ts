import { useQuery } from '@tanstack/react-query';

import { authService } from '../authService';

/**
 * React Query hook for user data
 * Caches user data to avoid redundant RPC calls
 */
export const useUserData = (email: string | null | undefined) => {
  return useQuery({
    queryKey: ['user', 'data', email],
    queryFn: async () => {
      if (!email) {
        throw new Error('Email is required');
      }
      return await authService.getUserDataByEmail(email);
    },
    enabled: !!email,
    // Use global config: staleTime Infinity, no auto-refetch
  });
};
