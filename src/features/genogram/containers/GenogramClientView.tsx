import React from 'react';

import type { Client } from '@/features/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { GenogramExportModal } from '@/widgets/genogram/export';
import { GenogramEmptyState } from '@/widgets/genogram/GenogramEmptyState';
import { GenogramGenerationSteps } from '@/widgets/genogram/GenogramGenerationSteps';
import {
  DEFAULT_GUIDE_STEPS,
  GenogramGuideModal,
  GUIDE_DONT_SHOW_AGAIN_KEY,
} from '@/widgets/genogram/GenogramGuideModal';
import { GenogramPageHeader } from '@/widgets/genogram/GenogramPageHeader';
import { ResetConfirmModal } from '@/widgets/genogram/ResetConfirmModal';
import { GenogramReportModal } from '@/widgets/report/GenogramReportModal';

import type { GenogramStep } from '../hooks/useGenogramSteps';
import type { AIGenogramOutput } from '../utils/aiJsonConverter';

interface StepsState {
  isOpen: boolean;
  currentStep: GenogramStep;
  isLoading: boolean;
  error: string | null;
  aiOutput: AIGenogramOutput | null;
  updateAiOutput: (output: AIGenogramOutput) => void;
  reset: () => void;
}

export interface GenogramClientViewProps {
  clients: Client[];
  clientId: string | null;
  selectedClient: Client | null;
  genogramRef: React.RefObject<GenogramPageHandle | null>;
  isLoading: boolean;
  isStarting: boolean;
  isTemporaryMode: boolean;
  showCanvas: boolean;
  hasData: boolean;
  hasRecords: boolean;
  initialData?: string;
  // Header actions
  canUndo: boolean;
  canRedo: boolean;
  isPanelOpen: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isResetting: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onSave: () => void;
  onReset?: () => void;
  onShowBasicInfo?: () => void;
  onShowReport?: () => void;
  onClientSelect: (client: Client | null) => void;
  onAddClient: () => void;
  // Steps
  steps: StepsState;
  isEditMode: boolean;
  onConfirm: () => void;
  onNextToRender: () => void;
  onEditApply: () => void;
  onEditCancel: () => void;
  onStepsComplete: () => void;
  // Empty state
  onStartEmpty: () => void;
  onStartFromRecords: (forceRefresh?: boolean) => void;
  // Canvas
  onCanvasChange: (json: string) => void;
  updateGenogramState: () => void;
  // Modals
  isAddClientModalOpen: boolean;
  onAddClientModalClose: (open: boolean) => void;
  onClientCreated: (newClientId: string) => void;
  isResetModalOpen: boolean;
  onSetResetModalOpen: (open: boolean) => void;
  onResetConfirm: () => void;
  isExportModalOpen: boolean;
  onSetExportModalOpen: (open: boolean) => void;
  exportImageData: string | null;
  isGuideModalOpen: boolean;
  onSetGuideModalOpen: (open: boolean) => void;
  isReportModalOpen: boolean;
  onSetReportModalOpen: (open: boolean) => void;
}

export const GenogramClientView: React.FC<GenogramClientViewProps> = ({
  clients,
  clientId,
  selectedClient,
  genogramRef,
  isLoading,
  isStarting,
  isTemporaryMode,
  showCanvas,
  hasData,
  hasRecords,
  initialData,
  canUndo,
  canRedo,
  isPanelOpen,
  isSaving,
  lastSavedAt,
  isResetting,
  onUndo,
  onRedo,
  onExport,
  onSave,
  onReset,
  onShowBasicInfo,
  onShowReport,
  onClientSelect,
  onAddClient,
  steps,
  isEditMode,
  onConfirm,
  onNextToRender,
  onEditApply,
  onEditCancel,
  onStepsComplete,
  onStartEmpty,
  onStartFromRecords,
  onCanvasChange,
  updateGenogramState,
  isAddClientModalOpen,
  onAddClientModalClose,
  onClientCreated,
  isResetModalOpen,
  onSetResetModalOpen,
  onResetConfirm,
  isExportModalOpen,
  onSetExportModalOpen,
  exportImageData,
  isGuideModalOpen,
  onSetGuideModalOpen,
  isReportModalOpen,
  onSetReportModalOpen,
}) => {
  return (
    <div className="relative h-full">
      {/* 캔버스 위 오버레이: 드롭다운 + 액션 버튼 */}
      <GenogramPageHeader
        clients={clients}
        selectedClient={selectedClient}
        onClientSelect={onClientSelect}
        onUndo={onUndo}
        onRedo={onRedo}
        onExport={onExport}
        onSave={onSave}
        showActions={
          !!showCanvas && !(steps.isOpen && steps.currentStep === 'edit')
        }
        canUndo={canUndo}
        canRedo={canRedo}
        isPanelOpen={isPanelOpen}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        onAddClient={onAddClient}
        isTemporaryMode={isTemporaryMode}
        onReset={onReset}
        isResetting={isResetting}
        onShowBasicInfo={onShowBasicInfo}
        onShowReport={onShowReport}
      />

      {/* 콘텐츠 영역 */}
      {isLoading || isStarting ? (
        <div className="flex h-full items-center justify-center">
          <span className="text-fg-muted">불러오는 중...</span>
        </div>
      ) : isTemporaryMode ? (
        <GenogramPage
          key="temporary"
          ref={genogramRef}
          onChange={updateGenogramState}
        />
      ) : !clientId ? (
        <>
          <GenogramPage
            key="no-client"
            ref={genogramRef}
            onChange={updateGenogramState}
            hideToolbar
          />
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex h-[200px] w-[512px] flex-col justify-center rounded-lg border border-dashed border-border bg-white p-8 text-center backdrop-blur-sm">
              <p className="text-lg font-medium text-fg-muted">
                클라이언트를 선택해주세요
              </p>
            </div>
          </div>
        </>
      ) : steps.isOpen ? (
        <GenogramGenerationSteps
          currentStep={steps.currentStep}
          isLoading={steps.isLoading}
          error={steps.error}
          aiOutput={steps.aiOutput}
          clientName={selectedClient?.name}
          isRenderPending={false}
          isEditMode={isEditMode}
          onConfirm={onConfirm}
          onAiOutputChange={steps.updateAiOutput}
          onNextToRender={
            steps.currentStep === 'edit' ? onEditApply : onNextToRender
          }
          onComplete={onStepsComplete}
          onCancel={steps.reset}
          onEditCancel={onEditCancel}
        />
      ) : !hasData ? (
        <GenogramEmptyState
          onStartEmpty={onStartEmpty}
          onStartFromRecords={onStartFromRecords}
          isGenerating={false}
          hasRecords={hasRecords}
        />
      ) : (
        <GenogramPage
          key={clientId}
          ref={genogramRef}
          initialData={initialData}
          onChange={onCanvasChange}
          emptyStateActions={
            hasRecords && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-fg-muted">
                  혹시 처음부터 그리는게 어렵나요?
                </span>
                <button
                  onClick={() => onStartFromRecords(true)}
                  className="rounded-md border border-border bg-white px-3 py-1.5 font-medium text-fg transition-colors hover:bg-surface-strong"
                >
                  AI로 자동 생성하기
                </button>
              </div>
            )
          }
        />
      )}

      {/* 클라이언트 추가 모달 */}
      <AddClientModal
        open={isAddClientModalOpen}
        onOpenChange={onAddClientModalClose}
        onClientCreated={onClientCreated}
      />

      {/* 가계도 초기화 확인 모달 */}
      <ResetConfirmModal
        open={isResetModalOpen}
        onOpenChange={onSetResetModalOpen}
        clientName={selectedClient?.name ?? ''}
        onConfirm={onResetConfirm}
        isLoading={isResetting}
      />

      {/* 이미지 내보내기 모달 */}
      {isExportModalOpen && (
        <GenogramExportModal
          key={exportImageData?.slice(0, 50)}
          open={isExportModalOpen}
          onOpenChange={onSetExportModalOpen}
          imageData={exportImageData}
          defaultFileName={`${selectedClient?.name ?? '가계도'}_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`}
          watermarkSrc="/genogram/genogram-export-watermark.png"
        />
      )}

      {/* 가계도 안내 모달 */}
      <GenogramGuideModal
        open={isGuideModalOpen}
        onOpenChange={onSetGuideModalOpen}
        steps={DEFAULT_GUIDE_STEPS}
        onDontShowAgain={() => {
          localStorage.setItem(GUIDE_DONT_SHOW_AGAIN_KEY, 'true');
        }}
      />

      {/* 가계도 분석 보고서 모달 */}
      <GenogramReportModal
        open={isReportModalOpen}
        onOpenChange={onSetReportModalOpen}
        genogramRef={genogramRef}
        clientId={clientId ?? undefined}
        clientName={selectedClient?.name}
      />
    </div>
  );
};
