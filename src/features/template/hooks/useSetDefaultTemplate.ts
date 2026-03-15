import { useMutation } from '@tanstack/react-query';

import { templateService } from '@/shared/api/supabase/templateQueries';
import { useAuthStore } from '@/stores/authStore';

export const useSetDefaultTemplate = () => {
  const userId = useAuthStore((state) => state.userId);
  const setDefaultTemplateId = useAuthStore(
    (state) => state.setDefaultTemplateId
  );

  return useMutation({
    mutationFn: async (templateId: number) => {
      if (!userId) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      return await templateService.setDefaultTemplate({
        user_id: userId,
        template_id: templateId,
      });
    },
    onSuccess: (_, templateId) => {
      setDefaultTemplateId(templateId);
    },
  });
};
