import { useQueries } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { templateQueryKeys } from '../constants/queryKeys';
import { templateService } from '../services/templateService';
import type { TemplateListItem } from '../types';

export const useTemplateList = () => {
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);

  const results = useQueries({
    queries: [
      {
        queryKey: templateQueryKeys.list(),
        queryFn: async () => {
          const response = await templateService.getTemplates();
          return response.templates;
        },
      },
      {
        queryKey: userId ? templateQueryKeys.pin(userId) : ['template-pins'],
        queryFn: async () => {
          if (!userId) return [];
          const response = await templateService.getTemplatePins({
            user_id: userId,
          });
          return response.template_ids;
        },
        enabled: !!userId,
      },
    ],
  });

  const [templatesQuery, pinsQuery] = results;

  const templates: TemplateListItem[] = (templatesQuery.data || [])
    .map((template) => ({
      ...template,
      pin: pinsQuery.data?.includes(template.id) || false,
      is_default: template.id === defaultTemplateId,
    }))
    .sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;

      if (a.pin && !b.pin) return -1;
      if (!a.pin && b.pin) return 1;

      return a.id - b.id;
    });

  return {
    templates,
    isLoading: templatesQuery.isLoading || pinsQuery.isLoading,
    error:
      templatesQuery.error?.message ||
      pinsQuery.error?.message ||
      (templatesQuery.isError || pinsQuery.isError
        ? '템플릿 목록을 불러올 수 없습니다.'
        : null),
  };
};
