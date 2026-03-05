import { useEffect, useRef } from 'react';

import { ArrowLeft, Loader2, X } from 'lucide-react';

import { SnackBar } from '@/components/ui/composites/SnackBar';
import { useModalStore } from '@/stores/modalStore';

import { CreationFlowButton } from './CreationFlowButton';
import { PreviewExportButton } from './PreviewExportButton';
import { GeneratingStep } from './steps/GeneratingStep';
import { InputStep } from './steps/InputStep';
import { PreviewStep } from './steps/PreviewStep';
import { ReportListStep } from './steps/ReportListStep';
import { SeminarPromptStep } from './steps/SeminarPromptStep';
import { VerifyStep } from './steps/VerifyStep';
import type { GenogramReportModalProps } from './types';
import { useReportModal } from './useReportModal';

export function GenogramReportModal(props: GenogramReportModalProps) {
  const modal = useReportModal(props);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openModal = useModalStore((s) => s.openModal);

  // 스텝 변경 시 스크롤 초기화
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [modal.step]);

  if (!props.open) return null;

  const isCreationFlow = modal.step === 'verify' || modal.step === 'input';
  const isGenerating =
    modal.step === 'generating' && modal.generatingStatus === 'processing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        role="presentation"
        className="fixed inset-0 animate-[fadeIn_0.2s_ease-out] bg-black/50"
        onClick={() => {
          if (!isGenerating) modal.handleClose();
        }}
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[788px] max-h-[90vh] w-11/12 max-w-[512px] flex-col rounded-2xl bg-white shadow-xl">
        {/* ── 헤더 ── */}
        <div className="relative shrink-0 px-[49px] pb-2 pt-[39px]">
          {modal.step === 'preview' && (
            <button
              type="button"
              onClick={modal.handleBackToList}
              className="absolute left-[49px] top-[39px] rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-center text-xl font-bold text-fg">
            가계도 분석 보고서
          </h2>
          {!isGenerating && (
            <button
              type="button"
              onClick={modal.handleClose}
              className="absolute right-[49px] top-[39px] rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── 본문 ── */}
        {modal.step === 'generating' ? (
          <GeneratingStep status={modal.generatingStatus} onSuccessProceed={modal.handleSuccessProceed} />
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-[49px] py-4"
          >
            {modal.isChecking || modal.hasAccess === null ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-fg-muted" />
              </div>
            ) : !modal.hasAccess ? (
              <SeminarPromptStep />
            ) : modal.step === 'list' ? (
              <ReportListStep
                reports={modal.reports}
                isLoading={modal.isLoadingReports}
                retryingId={modal.retryingId}
                onCreateReport={modal.handleCreateReport}
                onDownloadReport={modal.handleDownloadReport}
                onPreviewReport={modal.handlePreviewReport}
                onRetryReport={modal.handleRetryReport}
              />
            ) : modal.step === 'preview' ? (
              <PreviewStep
                pdfUrl={modal.pdfUrl}
                isLoading={modal.isLoadingPreview}
                isCapturing={modal.isCapturing}
                previewTitle={modal.previewTitle}
                onTitleChange={modal.setPreviewTitle}
              />
            ) : modal.step === 'verify' ? (
              <VerifyStep
                snapshotImage={modal.snapshotImage}
                answers={modal.answers}
                onAnswerChange={modal.setAnswer}
              />
            ) : (
              <InputStep
                formData={modal.formData}
                onFormChange={modal.setFormField}
              />
            )}
          </div>
        )}

        {/* ── 하단 버튼 ── */}
        {(modal.step !== 'generating' ||
          modal.generatingStatus === 'error') && (
          <div className="shrink-0 px-[49px] pb-6">
            {modal.hasAccess === false ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={modal.handleClose}
                  className="flex-1 rounded-xl border border-border py-3.5 text-center text-base font-semibold text-fg transition-colors hover:bg-surface-contrast"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://nextgenogram.mindthos.com/', '_blank');
                  }}
                  className="flex-1 rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400"
                >
                  세미나 신청하기
                </button>
              </div>
            ) : modal.step === 'preview' ? (
              <PreviewExportButton
                disabled={!modal.pdfUrl}
                onExport={modal.handleDownloadPreviewPdf}
                onBackToList={modal.handleBackToList}
              />
            ) : isCreationFlow ? (
              <CreationFlowButton
                step={modal.step}
                answers={modal.answers}
                formData={modal.formData}
                onVerifyComplete={modal.handleVerifyComplete}
                onInputComplete={modal.handleInputComplete}
              />
            ) : modal.step === 'generating' &&
              modal.generatingStatus === 'error' ? (
              <button
                type="button"
                onClick={modal.handleBackToList}
                className="w-full rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400"
              >
                확인
              </button>
            ) : (
              <button
                type="button"
                onClick={modal.handleClose}
                className="w-full rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400"
              >
                확인
              </button>
            )}
          </div>
        )}
      </div>

      {modal.debugPanel}

      {/* 크레딧 부족 SnackBar */}
      <SnackBar
        open={!!modal.creditError}
        message={modal.creditError ?? ''}
        onOpenChange={(open) => {
          if (!open) modal.setCreditError(null);
        }}
        action={{
          label: '플랜 업그레이드',
          onClick: () => openModal('planChange'),
        }}
        duration={8000}
      />
    </div>
  );
}
