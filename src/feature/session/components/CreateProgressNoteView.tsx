import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { templateService } from '@/feature/template/services/templateService';
import type { Template } from '@/feature/template/types';

import { TemplateCard } from './TemplateCard';

interface CreateProgressNoteViewProps {
  sessionId: string;
  transcribedText: string | null;
  usedTemplateIds: number[];
  isCreating: boolean;
  creatingTemplateId: number | null;
  onCreateStart: (templateId: number) => void;
}

export const CreateProgressNoteView: React.FC<CreateProgressNoteViewProps> = ({
  transcribedText,
  usedTemplateIds,
  isCreating,
  creatingTemplateId,
  onCreateStart,
}) => {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 템플릿 목록 조회
  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await templateService.getTemplates();
        setTemplates(response.templates);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '템플릿 목록 조회에 실패했습니다.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // 사용 가능한 템플릿 필터링
  const availableTemplates = React.useMemo(() => {
    return templates.filter(
      (template) => !usedTemplateIds.includes(template.id)
    );
  }, [templates, usedTemplateIds]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text className="text-fg-muted">템플릿 목록을 불러오는 중...</Text>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Text className="text-destructive">{error}</Text>
          <Text className="mt-2 text-sm text-fg-muted">
            페이지를 새로고침하거나 다시 시도해주세요.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* 헤더 */}
      <div>
        <Title as="h2">상담 노트 만들기</Title>
        <Text className="mt-2 text-fg-muted">생성할 템플릿을 선택하세요</Text>
      </div>

      {/* 전사 텍스트 없음 경고 */}
      {!transcribedText && (
        <div className="border-warning bg-warning/10 rounded-lg border p-4">
          <Text className="text-warning-foreground text-sm">
            전사 내용이 없어 상담 노트를 생성할 수 없습니다.
          </Text>
        </div>
      )}

      {/* 템플릿 카드 그리드 */}
      {availableTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isCreating={creatingTemplateId === template.id}
              disabled={isCreating || !transcribedText}
              onSelect={() => onCreateStart(template.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <Text className="text-fg-muted">
            모든 템플릿을 이미 사용했습니다.
          </Text>
        </div>
      )}
    </div>
  );
};
