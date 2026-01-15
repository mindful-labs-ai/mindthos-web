import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { templateQueryKeys } from '../constants/queryKeys';
import { templateService } from '../services/templateService';

export const useToggleTemplatePin = () => {
  const userId = useAuthStore((state) => state.userId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: number) => {
      if (!userId) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      return await templateService.toggleTemplatePin({
        user_id: userId,
        template_id: templateId,
      });
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: templateQueryKeys.pin(userId),
        });
      }
    },
  });
};
