import { useState } from 'react';

import { FileText, RotateCw } from 'lucide-react';

import type {
  ClientAnalysis,
  ClientTemplateGroups,
} from '@/features/client/types/clientAnalysis.types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useMarkdownEditSession } from '@/shared/hooks/useMarkdownEditSession';
import { CheckIcon, CopyIcon } from '@/shared/icons';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';
import { useToast } from '@/shared/ui/composites/Toast';
import { removeNonverbalTags } from '@/shared/utils/removeNonverbalTag';
import { stripMarkdown } from '@/shared/utils/stripMarkdown';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';

interface SupervisionReportViewProps {
  analysis: ClientAnalysis;
  templates: ClientTemplateGroups | undefined;
  /** 보고서 재생성 — 기존 다회기 분석 모달 오픈 */
  onCreateAnalysis: () => void;
  /** 편집 저장 핸들러 */
  onSaveContent?: (analysisId: string, content: string) => Promise<void>;
}

const ACTION_BUTTON_CLASS =
  'flex items-center gap-1 rounded-lg border border-[#EDEFF6] bg-white px-3.5 py-1.5 text-m font-medium text-[#9C9EA6] transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-80';

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** 슈퍼비전 보고서 본문 — 제목/액션/정보 테이블/마크다운 콘텐츠 */
export function SupervisionReportView({
  analysis,
  templates,
  onCreateAnalysis,
  onSaveContent,
}: SupervisionReportViewProps) {
  const { toast } = useToast();
  const userName = useAuthStore((state) => state.userName);
  const organization = useAuthStore((state) => state.organization);
  const openModal = useModalStore((state) => state.openModal);
  const [isCopied, setIsCopied] = useState(false);

  // 템플릿 조회 — 제목(이름)과 주제(설명)
  const template = templates
    ? [
        ...(templates.ai_supervision || []),
        ...(templates.profiling || []),
        ...(templates.psychotherapy_plan || []),
      ].find((t) => t.id === analysis.template_id)
    : undefined;
  const title = template?.name || 'AI 슈퍼비전';
  const topic = template?.description || '-';
  const dateStr = analysis.created_at ? formatDate(analysis.created_at) : '';

  const {
    isEditing,
    hasEdits,
    isSaving,
    handleEditStart,
    handleCancelEdit,
    handleSaveEdit,
    markdownRef,
  } = useMarkdownEditSession({
    originalContent: analysis.content ?? null,
    inlineEdit: true,
    onSave: async (content) => {
      if (onSaveContent && analysis.id) {
        await onSaveContent(analysis.id, content);
      }
    },
    isReadOnly: !onSaveContent,
    trackingEvents: {
      editStart: MixpanelEvent.AnalysisEditStart,
      editCancel: MixpanelEvent.AnalysisEditCancel,
      editComplete: MixpanelEvent.AnalysisEditComplete,
    },
    trackingMeta: {
      analysis_id: analysis.id,
      version: analysis.version,
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        stripMarkdown(analysis.content || '')
      );
      setIsCopied(true);
      trackEvent(MixpanelEvent.AnalysisCopy, { tab: 'ai_supervision' });
      toast({
        title: '복사 완료',
        description: '내용을 복사했어요.',
        duration: 2000,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패 — 다시 시도해 주세요.',
        description: '내용을 복사하지 못했어요.',
        duration: 3000,
      });
    }
  };

  const handlePdfExport = () => {
    openModal('comingSoon', { source: 'ai_supervision_pdf' });
  };

  return (
    <div className="p-10">
      {/* 헤더: 제목 + 액션 버튼 */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[28px] font-headline leading-[1.2] text-grey-100">
          {title}
        </h2>
        <div className="flex flex-shrink-0 items-center gap-3">
          {!isEditing ? (
            <>
              {onSaveContent && (
                <button
                  type="button"
                  onClick={handleEditStart}
                  className={ACTION_BUTTON_CLASS}
                >
                  편집
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className={ACTION_BUTTON_CLASS}
              >
                {isCopied ? (
                  <>
                    <CheckIcon size={18} className="text-green-80" />
                    <span className="text-green-80">복사됨</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={20} />
                    복사하기
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePdfExport}
                className={ACTION_BUTTON_CLASS}
              >
                <FileText size={18} />
                PDF 출력하기
              </button>
              <button
                type="button"
                onClick={() => {
                  trackEvent(MixpanelEvent.SupervisionRetry);
                  onCreateAnalysis();
                }}
                className={ACTION_BUTTON_CLASS}
              >
                <RotateCw size={18} />
                보고서 재생성
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className={ACTION_BUTTON_CLASS}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!hasEdits || isSaving}
                className={`rounded-lg px-3.5 py-1.5 text-m font-medium transition-colors ${
                  hasEdits && !isSaving
                    ? 'bg-green-80 text-white lg:hover:opacity-90'
                    : 'cursor-not-allowed bg-grey-20 text-grey-60'
                }`}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 메타: 작성자 + 작성일 */}
      <div className="mt-5 flex items-center gap-3 text-sm font-medium text-[#9C9EA6]">
        {userName && <span>{userName} 상담사</span>}
        {dateStr && <span>{dateStr} 작성됨</span>}
      </div>

      <div className="mt-6 border-t border-[#EDEFF6]" />

      {/* 보고서 정보 테이블 */}
      <table className="mt-10 w-full border-collapse text-m text-grey-100">
        <tbody>
          <tr>
            <td className="w-36 border border-[#D6D8E1] px-3 py-[15px]">
              상담사
            </td>
            <td className="border border-[#D6D8E1] px-3 py-[15px]">
              {userName || '-'}
            </td>
            <td className="w-36 border border-[#D6D8E1] px-3 py-[15px]">
              소속 상담기관
            </td>
            <td className="border border-[#D6D8E1] px-3 py-[15px]">
              {organization || '-'}
            </td>
          </tr>
          <tr>
            <td className="border border-[#D6D8E1] px-3 py-[15px]">
              수퍼바이저
            </td>
            <td className="border border-[#D6D8E1] px-3 py-[15px]">
              마음토스 마스터 임상 수퍼바이저
            </td>
            <td className="border border-[#D6D8E1] px-3 py-[15px]">일자</td>
            <td className="border border-[#D6D8E1] px-3 py-[15px]">
              {dateStr || '-'}
            </td>
          </tr>
          <tr>
            <td className="border border-[#D6D8E1] px-3 py-[15px]">주제</td>
            <td className="border border-[#D6D8E1] px-3 py-[15px]" colSpan={3}>
              {topic}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 마크다운 본문 */}
      <div className="mt-10">
        <MarkdownRenderer
          ref={isEditing ? markdownRef : undefined}
          content={removeNonverbalTags(analysis.content || '')}
          className="text-start"
          editable={isEditing}
        />
      </div>
    </div>
  );
}
