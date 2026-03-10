import { useQuery } from '@tanstack/react-query';

import { termsContentService } from '../services/termsContentService';

export const useTermsContent = (type: string) => {
  const query = useQuery({
    queryKey: ['terms', 'content', type],
    queryFn: async () => {
      const response = await termsContentService.getContent(type);
      if (!response.success) {
        throw new Error('약관 내용을 불러올 수 없습니다.');
      }
      const content = response.content;

      // sections가 JSON string으로 올 경우 파싱
      if (typeof content.sections === 'string') {
        content.sections = JSON.parse(content.sections);
      }

      // sections가 seed 객체 전체로 저장된 경우 (sections.sections에 실제 배열)
      if (!Array.isArray(content.sections) && content.sections?.sections) {
        const nested = content.sections;
        content.title = nested.title ?? content.title;
        content.description = nested.description ?? content.description;
        content.sections = nested.sections;
      }

      return content;
    },
    staleTime: Infinity,
  });

  return {
    content: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
