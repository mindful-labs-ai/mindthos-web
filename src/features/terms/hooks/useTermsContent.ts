import { useQuery } from '@tanstack/react-query';

import { termsQueryKeys } from '@/shared/constants/queryKeys';

import { termsContentService } from '../services/termsContentService';
import type { NormalizedTermsContent } from '../types';

export const useTermsContent = (type: string) => {
  const query = useQuery<NormalizedTermsContent>({
    queryKey: termsQueryKeys.content(type),
    queryFn: async () => {
      const response = await termsContentService.getContent(type);
      if (!response.success) {
        throw new Error('약관 내용을 불러올 수 없어요.');
      }
      const { content } = response;

      // sections가 JSON string으로 올 경우 파싱
      let sections = content.sections;
      if (typeof sections === 'string') {
        sections = JSON.parse(sections);
      }

      // sections가 seed 객체 전체로 저장된 경우 (sections.sections에 실제 배열)
      if (
        !Array.isArray(sections) &&
        typeof sections === 'object' &&
        sections.sections
      ) {
        return {
          ...content,
          title: sections.title ?? content.title,
          description: sections.description ?? content.description,
          sections: sections.sections,
        };
      }

      return {
        ...content,
        sections: Array.isArray(sections) ? sections : [],
      };
    },
    staleTime: Infinity,
  });

  return {
    content: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
