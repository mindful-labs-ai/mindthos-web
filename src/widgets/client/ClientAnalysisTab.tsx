import React, { useState, useMemo, useCallback } from 'react';

import { useClientTemplates } from '@/features/client/hooks/useClientAnalysis';
import type {
  ClientAnalysis,
  ClientAnalysisVersion,
} from '@/features/client/types/clientAnalysis.types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { useMarkdownEditSession } from '@/shared/hooks/useMarkdownEditSession';
import { CheckIcon, ChevronRightIcon, CopyIcon } from '@/shared/icons';
import { Modal } from '@/shared/ui';
import type { TabItem } from '@/shared/ui/atoms/Tab';
import { Tab } from '@/shared/ui/atoms/Tab';
import { Text } from '@/shared/ui/atoms/Text';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';
import type { SelectItem } from '@/shared/ui/composites/Select';
import { Select } from '@/shared/ui/composites/Select';
import { useToast } from '@/shared/ui/composites/Toast';
import { removeNonverbalTags } from '@/shared/utils/removeNonverbalTag';
import { stripMarkdown } from '@/shared/utils/stripMarkdown';

import { LockedFeatureModal } from './LockedFeatureModal';
import {
  parseSupervisionReport,
  SupervisionReportRenderer,
} from './SupervisionReportRenderer';

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
  isMobileView?: boolean;
}

export const ClientAnalysisTab: React.FC<ClientAnalysisTabProps> = ({
  analyses,
  isLoading = false,
  onCreateAnalysis,
  pollingVersion,
  isReadOnly = false,
  onSaveContent,
  isMobileView = false,
}) => {
  const { toast } = useToast();
  const { isTablet } = useDevice();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
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
      editStart: MixpanelEvent.AnalysisEditStart,
      editCancel: MixpanelEvent.AnalysisEditCancel,
      editComplete: MixpanelEvent.AnalysisEditComplete,
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
    if (!templateId || !templates) return 'AI 슈퍼비전';
    const allTemplates = [
      ...(templates.ai_supervision || []),
      ...(templates.profiling || []),
      ...(templates.psychotherapy_plan || []),
    ];
    const template = allTemplates.find((t) => t.id === templateId);
    return template?.name || 'AI 슈퍼비전';
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
          <span className="typo-xs text-fg-muted">
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
      await navigator.clipboard.writeText(stripMarkdown(content));
      setCopiedKey('ai_supervision');

      trackEvent(MixpanelEvent.AnalysisCopy, { tab: activeTab });

      toast({
        title: '복사 완료',
        description: '내용을 복사했어요.',
        duration: 2000,
      });

      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패 — 다시 시도해 주세요.',
        description: '내용을 복사하지 못했어요.',
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
            {analysis.error_message || '분석을 만들지 못했어요.'}
          </Text>
        </div>
      );
    }

    // 완료 상태
    if (analysis?.status === 'succeeded' && analysis.content) {
      const title = getTemplateName(analysis.template_id);
      const dateStr = analysis.created_at
        ? formatDate(analysis.created_at)
        : '';
      // JSON 보고서는 인라인 편집 미지원 → 편집 진입 버튼 숨김.
      const report = parseSupervisionReport(analysis.content);
      const canEdit = report === null && onSaveContent && !isReadOnly;

      return (
        <div className="relative">
          {/* 헤더: 타이틀 + 액션 버튼 */}
          <div className="mb-2 flex items-start justify-between">
            <h2
              className={
                isMobileView
                  ? 'text-l font-headline text-grey-100'
                  : 'text-xl font-headline text-grey-100'
              }
            >
              {title}
            </h2>
            <div className="flex flex-shrink-0 items-center gap-2">
              {!isEditing && (
                <>
                  {/* 데스크탑: 모든 버튼 인라인 */}
                  {!isMobileView && (
                    <>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={handleEditStart}
                          className="rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                        >
                          편집
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(analysis.content || '')}
                        className="flex items-center gap-1 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                      >
                        {copiedKey === 'ai_supervision' ? (
                          <>
                            <CheckIcon size={18} className="text-green-80" />
                            <span className="text-green-80">복사됨</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon size={20} /> 복사하기
                          </>
                        )}
                      </button>
                      {onCreateAnalysis && (
                        <button
                          type="button"
                          onClick={() => {
                            trackEvent(MixpanelEvent.SupervisionRetry);
                            onCreateAnalysis();
                          }}
                          className="rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                        >
                          보고서 재생성
                        </button>
                      )}
                    </>
                  )}
                  {/* 태블릿: 편집/복사 인라인 + ⋮ */}
                  {isMobileView && isTablet && (
                    <>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={handleEditStart}
                          className="rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                        >
                          편집
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(analysis.content || '')}
                        className="flex items-center gap-1 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                      >
                        <CopyIcon size={20} /> 복사하기
                      </button>
                    </>
                  )}
                  {/* 모바일/태블릿: ⋮ 메뉴 */}
                  {isMobileView && (
                    <>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-grey-60 transition-colors lg:hover:bg-grey-20 lg:hover:text-grey-80"
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="추가 메뉴"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      <Modal
                        open={isMenuOpen}
                        onOpenChange={setIsMenuOpen}
                        mobileVariant="bottomSheet"
                      >
                        <div className="mb-16 w-full space-y-1">
                          {!isTablet && canEdit && (
                            <button
                              onClick={() => {
                                handleEditStart();
                                setIsMenuOpen(false);
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                            >
                              <span className="text-l text-grey-100">편집</span>
                              <ChevronRightIcon
                                size={20}
                                className="text-grey-70"
                              />
                            </button>
                          )}
                          {!isTablet && (
                            <button
                              onClick={() => {
                                handleCopy(analysis.content || '');
                                setIsMenuOpen(false);
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                            >
                              <span className="text-l text-grey-100">
                                복사하기
                              </span>
                              <ChevronRightIcon
                                size={20}
                                className="text-grey-70"
                              />
                            </button>
                          )}
                          {onCreateAnalysis && (
                            <button
                              onClick={() => {
                                trackEvent(MixpanelEvent.SupervisionRetry);
                                onCreateAnalysis();
                                setIsMenuOpen(false);
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                            >
                              <span className="text-l text-grey-100">
                                보고서 재생성
                              </span>
                              <ChevronRightIcon
                                size={20}
                                className="text-grey-70"
                              />
                            </button>
                          )}
                        </div>
                      </Modal>
                    </>
                  )}
                </>
              )}

              {/* 편집 중 */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="rounded-md border border-grey-30 px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!hasEdits || isSaving}
                    className={`rounded-md px-3.5 py-1 text-m font-medium transition-colors ${
                      hasEdits && !isSaving
                        ? 'bg-green-80 text-white lg:hover:opacity-90'
                        : 'cursor-not-allowed bg-grey-20 text-grey-60'
                    }`}
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 서브타이틀 */}
          <p className="mb-4 text-sm text-grey-60">
            {dateStr && `${dateStr} 작성됨`}
          </p>

          {/* 모바일: 구분선 */}
          {isMobileView && <div className="mb-6 border-b border-grey-30" />}

          {/* 본문: JSON(section/block) 보고서면 전용 렌더러, 아니면 구 Markdown 하위호환 */}
          {report ? (
            <SupervisionReportRenderer content={analysis.content} />
          ) : (
            <MarkdownRenderer
              ref={isEditing ? markdownRef : undefined}
              content={removeNonverbalTags(analysis.content)}
              className="text-start"
              editable={isEditing}
            />
          )}
        </div>
      );
    }

    // 데이터 없음
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Text className="text-fg-muted">분석 결과가 없어요.</Text>
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
      label: <span className="flex items-center">AI 슈퍼비전</span>,
    },
    {
      value: 'profiling',
      label: (
        <span className="flex items-center gap-1.5">
          프로파일링
          <div className="flex items-center rounded-md bg-fg-muted px-1 py-0.5">
            <span className="typo-xs font-headline text-surface">준비 중</span>
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
            <span className="typo-xs font-headline text-surface">준비 중</span>
          </div>
        </span>
      ),
      disabled: true,
    },
  ];

  // 빈 상태
  if (analyses.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {/* 탭 + 버전 선택 (데스크탑만) */}
        {!isMobileView && (
          <div className="flex items-center justify-between px-8">
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
        )}

        {/* 분석 내용 */}
        <div
          className={`flex h-full min-h-[400px] flex-col items-center justify-center bg-white p-6 ${
            isMobileView && !isTablet ? '' : 'rounded-lg border border-grey-30'
          }`}
        >
          <p className="mb-4 text-m text-grey-60">아직 분석 기록이 없어요.</p>
          {onCreateAnalysis && (
            <button
              type="button"
              onClick={onCreateAnalysis}
              className="rounded-lg bg-green-80 px-8 py-3 text-m font-medium text-white transition-colors lg:hover:opacity-90"
            >
              AI 슈퍼비전 받기
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
      {/* 탭 + 버전 선택 (데스크탑만) */}
      {!isMobileView && (
        <div className="flex flex-shrink-0 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Tab
              items={tabItems}
              value={activeTab}
              onValueChange={(value) => {
                trackEvent(MixpanelEvent.AnalysisTabChange, { tab: value });
                setActiveTab(value);
              }}
              onDisabledClick={handleDisabledTabClick}
              variant="underline"
              size="md"
            />
          </div>
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
      )}

      {/* 분석 내용 */}
      <div className="min-h-0 flex-1 md:rounded-lg md:bg-white">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto border border-grey-30 bg-white p-6 md:rounded-lg"
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
