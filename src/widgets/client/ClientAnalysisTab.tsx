import React, { useState, useMemo, useCallback } from 'react';

import { useClientTemplates } from '@/features/client/hooks/useClientAnalysis';
import type {
  ClientAnalysis,
  ClientAnalysisVersion,
} from '@/features/client/types/clientAnalysis.types';
import { trackEvent } from '@/lib/mixpanel';
import { useMarkdownEditSession } from '@/shared/hooks/useMarkdownEditSession';
import { CheckIcon, CopyIcon } from '@/shared/icons';
import type { TabItem } from '@/shared/ui/atoms/Tab';
import { Tab } from '@/shared/ui/atoms/Tab';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';
import type { SelectItem } from '@/shared/ui/composites/Select';
import { Select } from '@/shared/ui/composites/Select';
import { useToast } from '@/shared/ui/composites/Toast';
import { removeNonverbalTags } from '@/shared/utils/removeNonverbalTag';

import { LockedFeatureModal } from './LockedFeatureModal';

interface ClientAnalysisTabProps {
  analyses: ClientAnalysisVersion[];
  isLoading?: boolean;
  onCreateAnalysis?: () => void;
  /** 현재 폴링 중인 버전 (새 분석 생성 시 자동 선택용) */
  pollingVersion?: number | null;
  /** 읽기 전용 여부 */
  isReadOnly?: boolean;
  /** 분석 내용 저장 핸들러 */
  onSaveContent?: (analysisId: string, content: string) => Promise<void>;
}

export const ClientAnalysisTab: React.FC<ClientAnalysisTabProps> = ({
  analyses,
  isLoading = false,
  onCreateAnalysis,
  pollingVersion,
  isReadOnly = false,
  onSaveContent,
}) => {
  const { toast } = useToast();
  const { data: templates } = useClientTemplates();
  // 사용자가 수동으로 선택한 버전 (null이면 자동 선택)
  const [userSelectedVersion, setUserSelectedVersion] = useState<number | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<string>('ai_supervision');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);

  const handleDisabledTabClick = useCallback(() => {
    setIsLockedModalOpen(true);
  }, []);

  // 현재 표시할 버전 계산
  const selectedVersion = useMemo(() => {
    // 처리 중인 분석이 있으면 우선 표시
    const processingAnalysis = analyses.find(
      (a) =>
        a.ai_supervision?.status === 'pending' ||
        a.ai_supervision?.status === 'in_progress'
    );
    if (processingAnalysis) {
      return processingAnalysis.version;
    }

    // 폴링 중인 버전이 있으면 해당 버전 표시
    if (pollingVersion && analyses.some((a) => a.version === pollingVersion)) {
      return pollingVersion;
    }

    // 사용자가 수동 선택한 버전이 있고 유효하면 해당 버전 표시
    if (
      userSelectedVersion !== null &&
      analyses.some((a) => a.version === userSelectedVersion)
    ) {
      return userSelectedVersion;
    }

    // 기본값: 첫 번째 분석 (가장 최신)
    return analyses[0]?.version || 0;
  }, [analyses, pollingVersion, userSelectedVersion]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // 선택된 버전의 분석 데이터
  const currentAnalysis = analyses.find((a) => a.version === selectedVersion);
  const currentAnalysisData = currentAnalysis?.ai_supervision ?? null;

  // 전체 문서 편집 훅
  const {
    isEditing,
    hasEdits,
    isSaving,
    handleEditStart,
    handleCancelEdit,
    handleSaveEdit,
    markdownRef,
  } = useMarkdownEditSession({
    originalContent: currentAnalysisData?.content ?? null,
    inlineEdit: true,
    onSave: async (content) => {
      if (onSaveContent && currentAnalysisData?.id) {
        await onSaveContent(currentAnalysisData.id, content);
      }
    },
    isReadOnly: isReadOnly || !onSaveContent,
    trackingEvents: {
      editStart: 'analysis_edit_start',
      editCancel: 'analysis_edit_cancel',
      editComplete: 'analysis_edit_complete',
    },
    trackingMeta: {
      analysis_id: currentAnalysisData?.id,
      version: currentAnalysis?.version,
    },
  });

  // 버전 변경 시 편집 상태 리셋
  const prevVersionRef = React.useRef(selectedVersion);
  React.useEffect(() => {
    if (prevVersionRef.current !== selectedVersion && isEditing) {
      handleCancelEdit();
    }
    prevVersionRef.current = selectedVersion;
  }, [selectedVersion, isEditing, handleCancelEdit]);

  // 템플릿 이름 조회 헬퍼
  const getTemplateName = (templateId: number | undefined): string => {
    if (!templateId || !templates) return 'AI 수퍼비전';
    const allTemplates = [
      ...(templates.ai_supervision || []),
      ...(templates.profiling || []),
      ...(templates.psychotherapy_plan || []),
    ];
    const template = allTemplates.find((t) => t.id === templateId);
    return template?.name || 'AI 수퍼비전';
  };

  // 날짜 포맷 헬퍼
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 버전 선택 아이템
  const versionItems: SelectItem[] = analyses.map((analysis) => {
    const templateName = getTemplateName(analysis.ai_supervision?.template_id);
    const dateStr = formatDate(analysis.created_at);

    return {
      value: String(analysis.version),
      // 드롭다운에는 템플릿 이름과 회기 수 표시
      label: (
        <div className="flex flex-col">
          <span className="font-medium">{dateStr}</span>
          <span className="text-xs text-fg-muted">
            {templateName} / {analysis.session_ids.length}개 회기
          </span>
        </div>
      ),
      // 디스플레이에는 날짜만 표시
      displayLabel: dateStr,
    };
  });

  // 클립보드 복사
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey('ai_supervision');

      trackEvent('analysis_copy', { tab: activeTab });

      toast({
        title: '복사 완료',
        description: '클립보드에 내용이 복사되었습니다.',
        duration: 2000,
      });

      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패',
        description: '내용을 복사하는 데 실패했습니다.',
        duration: 3000,
      });
    }
  };

  // 분석 내용 렌더링
  const renderAnalysisContent = (analysis: ClientAnalysis | null) => {
    // 로딩 상태 - 진행 중인 경우
    if (analysis?.status === 'pending' || analysis?.status === 'in_progress') {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <Text className="text-fg-muted">분석 중...</Text>
        </div>
      );
    }

    // 실패 상태
    if (analysis?.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <Text className="text-danger">
            {analysis.error_message || '분석에 실패했습니다.'}
          </Text>
        </div>
      );
    }

    // 완료 상태
    if (analysis?.status === 'succeeded' && analysis.content) {
      return (
        <div className="relative">
          {/* 액션 버튼 영역 */}
          <div className="mb-6 flex items-center justify-end gap-2">
            {/* 편집 중이 아닐 때: 수퍼비전 다시 받기 + 편집 + 복사 */}
            {!isEditing && (
              <>
                {onSaveContent && !isReadOnly && (
                  <button
                    type="button"
                    onClick={handleEditStart}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-sm text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg"
                    aria-label="분석 편집"
                  >
                    <span>편집</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(analysis.content || '')}
                  className="group relative flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-sm font-medium text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg"
                  aria-label="전체 복사"
                >
                  {copiedKey === 'ai_supervision' ? (
                    <>
                      <CheckIcon size={18} className="text-success" />
                      <span className="text-success">복사됨</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={20} />
                      <span>복사하기</span>
                    </>
                  )}
                </button>
                {onCreateAnalysis && (
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('supervision_retry');
                      onCreateAnalysis();
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-primary bg-primary-100 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary-200"
                  >
                    수퍼비전 다시 받기
                  </button>
                )}
              </>
            )}

            {/* 편집 중일 때: 취소 + 저장 */}
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-contrast"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!hasEdits || isSaving}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    hasEdits && !isSaving
                      ? 'bg-primary text-white hover:bg-primary-600'
                      : 'cursor-not-allowed bg-surface-contrast text-fg-muted'
                  }`}
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>

          {/* 마크다운 렌더링 (편집 모드일 때 contentEditable) */}
          <MarkdownRenderer
            ref={isEditing ? markdownRef : undefined}
            content={removeNonverbalTags(analysis.content)}
            className="text-start"
            editable={isEditing}
          />
        </div>
      );
    }

    // 데이터 없음
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Text className="text-fg-muted">분석 결과가 없습니다.</Text>
      </div>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
        <Text className="text-fg-muted">분석 데이터를 불러오는 중...</Text>
      </div>
    );
  }

  // 탭 아이템 정의
  const tabItems: TabItem[] = [
    {
      value: 'ai_supervision',
      label: <span className="flex items-center">AI 수퍼비전</span>,
    },
    {
      value: 'profiling',
      label: (
        <span className="flex items-center gap-1.5">
          프로파일링
          <div className="flex items-center rounded-md bg-fg-muted px-1 py-0.5">
            <span className="text-xs font-bold text-surface">준비 중</span>
          </div>
        </span>
      ),
      disabled: true,
    },
    {
      value: 'psychotherapy_plan',
      label: (
        <span className="flex items-center gap-1.5">
          심리치료계획
          <div className="flex items-center rounded-md bg-fg-muted p-1">
            <span className="text-xs font-bold text-surface">준비 중</span>
          </div>
        </span>
      ),
      disabled: true,
    },
  ];

  // 빈 상태
  if (analyses.length === 0) {
    return (
      <div className="flex flex-col">
        {/* 탭 + 버전 선택 + 다회기 분석 버튼 */}
        <div className="flex items-center justify-between px-8">
          {/* 탭 영역 */}
          <div className="flex items-center gap-4">
            <Tab
              items={tabItems}
              value={activeTab}
              onValueChange={setActiveTab}
              onDisabledClick={handleDisabledTabClick}
              variant="underline"
              size="md"
            />
          </div>

          {/* 버전 선택 */}
          {analyses.length > 1 && (
            <div className="w-64">
              <Select
                items={versionItems}
                value={String(selectedVersion)}
                onChange={(value) => setUserSelectedVersion(Number(value))}
                placeholder="버전 선택"
              />
            </div>
          )}
        </div>

        {/* 분석 내용 */}
        <div className="relative min-h-[400px] rounded-lg border border-border bg-surface p-6">
          <Title as="h4" className="mb-8 text-left text-sm text-fg-muted">
            수퍼비전 보고서
          </Title>
          <Text className="text-center font-medium text-fg-muted">
            아직 분석 기록이 없습니다.
          </Text>{' '}
          {onCreateAnalysis && (
            <button
              type="button"
              onClick={onCreateAnalysis}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-primary bg-primary-100 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-200"
            >
              AI 수퍼비전 받기
            </button>
          )}
        </div>
        <LockedFeatureModal
          open={isLockedModalOpen}
          onOpenChange={setIsLockedModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 탭 + 버전 선택 + 다회기 분석 버튼 */}
      <div className="flex flex-shrink-0 items-center justify-between px-8">
        {/* 탭 영역 */}
        <div className="flex items-center gap-4">
          <Tab
            items={tabItems}
            value={activeTab}
            onValueChange={(value) => {
              trackEvent('analysis_tab_change', { tab: value });
              setActiveTab(value);
            }}
            onDisabledClick={handleDisabledTabClick}
            variant="underline"
            size="md"
          />
        </div>

        {/* 버전 선택 */}
        {analyses.length > 1 && (
          <div className="w-64">
            <Select
              items={versionItems}
              value={String(selectedVersion)}
              onChange={(value) => setUserSelectedVersion(Number(value))}
              placeholder="버전 선택"
              maxDropdownHeight={200}
            />
          </div>
        )}
      </div>

      {/* 분석 내용 */}
      <div className="min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto rounded-lg border border-border bg-surface p-6"
        >
          {currentAnalysis &&
            renderAnalysisContent(currentAnalysis.ai_supervision)}
        </div>
      </div>
      <LockedFeatureModal
        open={isLockedModalOpen}
        onOpenChange={setIsLockedModalOpen}
      />
    </div>
  );
};
